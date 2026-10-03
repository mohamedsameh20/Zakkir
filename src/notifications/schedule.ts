// Device side of prayer notifications: Android channels, permission, and
// handing the plan from plan.ts to expo-notifications.

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { cachedDays, DayTimes, planNotifications, selectedPrayers, startOfDay, Timings } from "./plan.ts";
import { serialize } from "./serialize.ts";
import {
  channelIdFor, REMOVED_SOUND_IDS, resolveSoundId, SILENT_SOUND_ID, SOUND_IDS, SOUND_LABELS, soundResource,
} from "./sounds.ts";

type Settings = Record<string, unknown>;

// Older builds shipped a single channel hardcoded to the system default sound.
const CHANNEL_ID_LEGACY = "prayer-reminders";

/** Create one channel per sound. Must run before anything is scheduled. */
export async function ensureChannels() {
  if (Platform.OS !== "android") return;
  try {
    // Android ignores sound changes on an existing channel, so each sound
    // needs its own channel created up front.
    await Promise.all(
      SOUND_IDS.map((soundId) =>
        Notifications.setNotificationChannelAsync(channelIdFor(soundId), {
          name: `Prayer reminders (${SOUND_LABELS[soundId] || soundId})`,
          importance: Notifications.AndroidImportance.HIGH,
          sound: soundResource(soundId),
          vibrationPattern: [0, 250, 250, 250],
        }),
      ),
    );

    // Silent still shows a heads-up notification, just without audio.
    await Notifications.setNotificationChannelAsync(channelIdFor(SILENT_SOUND_ID), {
      name: `Prayer reminders (${SOUND_LABELS[SILENT_SOUND_ID]})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      vibrationPattern: [0, 250, 250, 250],
    });

    // Remove channels earlier builds created so upgraders don't keep stale
    // entries in Android's notification settings.
    await Notifications.deleteNotificationChannelAsync(CHANNEL_ID_LEGACY).catch(() => undefined);
    await Promise.all(
      REMOVED_SOUND_IDS.map((soundId) =>
        Notifications.deleteNotificationChannelAsync(channelIdFor(soundId)).catch(() => undefined),
      ),
    );
  } catch (_) {}
}

/** Today's and the next two days' timings from AlAdhan, for upgraders with no cache yet. */
async function fetchDays(settings: Settings, today: Date): Promise<DayTimes[]> {
  const location = (settings?.location || {}) as Record<string, unknown>;
  const lat = Number(settings?.lat ?? location.lat);
  const lng = Number(settings?.lng ?? location.lng);
  const method = Number(settings?.method ?? location.method ?? 5);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
  const days: DayTimes[] = [];
  for (let offset = 0; offset < 3; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=${method}`);
      const json = await response.json();
      const source = json?.data?.timings;
      if (source) {
        days.push({ date, times: {
          Fajr: source.Fajr,
          Dhuhr: source.Dhuhr,
          Asr: source.Asr,
          Maghrib: source.Maghrib,
          Isha: source.Isha,
        } });
      }
    } catch (_) {}
  }
  return days;
}

/**
 * Replace all scheduled prayer notifications with a fresh rolling window.
 * Prayer times move every day, so a repeating daily notification would drift;
 * this schedules one-shot notifications instead.
 *
 * Calls are queued: on launch the shell restores the saved schedule while the
 * page sends a fresh one, and two interleaved runs would each cancel before
 * either scheduled, leaving every notification duplicated.
 */
export const scheduleNotifications = serialize(replaceSchedule);

async function replaceSchedule(times: Timings, settings: Settings) {
  try {
    if (settings?.notificationsEnabled === false) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }
    const permission = await Notifications.getPermissionsAsync();
    let granted = permission.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted || !selectedPrayers(settings).length) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const soundId = resolveSoundId(settings?.reminderSound);
    const channelId = channelIdFor(soundId);
    // iOS reads the sound off the notification; Android reads it off the channel.
    const contentSound: string | false = soundId === SILENT_SOUND_ID ? false : soundResource(soundId);

    await Notifications.cancelAllScheduledNotificationsAsync();

    // The page hands over upcoming days from its offline cache, so scheduling
    // works with no connectivity. The network is only a fallback for upgraders
    // whose cache is not yet populated.
    const today = startOfDay(new Date());
    let days = cachedDays(settings, today);
    if (!days.length) days = await fetchDays(settings, today);
    // Last resort: today's times as rendered, so something is always scheduled.
    if (!days.some(({ date }) => date.getTime() === today.getTime())) {
      days.unshift({ date: today, times });
    }

    await Promise.all(
      planNotifications(days, settings).map(({ title, body, date, prayer, type }) =>
        Notifications.scheduleNotificationAsync({
          content: { title, body, sound: contentSound, data: { prayer, type } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
        }),
      ),
    );
  } catch (_) {}
}
