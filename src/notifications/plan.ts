// Pure scheduling logic: turns prayer times and the page's notification
// settings into the list of notifications to schedule. No device APIs here,
// so it runs under node:test (see tests/notifications.test.ts).

import { arabicPlural, PRAYER_NAMES_AR, pickMessage } from "./messages.ts";

type Settings = Record<string, unknown>;
export type Timings = Record<string, unknown>;
export type DayTimes = { date: Date; times: Timings };
export type NotificationKind = "athan" | "pre" | "iqama";
export type PlannedNotification = {
  title: string;
  body: string;
  date: Date;
  prayer: string;
  type: NotificationKind;
};

// Android allows 500 pending alarms per app and we post at most 3 per prayer
// per day, so a 28-day window tops out at 420 alarms.
export const MAX_DAYS = 28;

export function clampMinutes(value: unknown, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return Math.min(60, Math.max(1, fallback));
  return Math.min(60, n);
}

export function parseHHMM(time: unknown): [number, number] | null {
  if (typeof time !== "string") return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return null;
  return [h, m];
}

/** Local midnight of the given day. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** YYYY-MM-DD in local time, the key format of the page's offline cache. */
export function dateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Prayers the user picked; the page stores either a list or a name->bool map. */
export function selectedPrayers(settings: Settings): string[] {
  const value = settings?.reminderPrayers;
  if (Array.isArray(value)) return value as string[];
  return Object.entries((value || {}) as Record<string, unknown>)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([prayer]) => prayer);
}

/** Whether anything at all should be scheduled. */
export function notificationsWanted(settings: Settings): boolean {
  return settings?.notificationsEnabled !== false && selectedPrayers(settings).length > 0;
}

/**
 * Days with known timings from the page's offline cache (`upcomingTimings`,
 * keyed YYYY-MM-DD), starting today, within the rolling window.
 */
export function cachedDays(settings: Settings, today: Date, maxDays = MAX_DAYS): DayTimes[] {
  const upcoming = (settings?.upcomingTimings || {}) as Record<string, Timings>;
  const start = startOfDay(today);
  const days: DayTimes[] = [];
  for (let offset = 0; offset < maxDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const cached = upcoming[dateKey(date)];
    if (cached) days.push({ date, times: cached });
  }
  return days;
}

/** Notifications for the given days, skipping any that are already past. */
export function planNotifications(
  days: DayTimes[],
  settings: Settings,
  now: Date = new Date(),
  random: () => number = Math.random,
): PlannedNotification[] {
  const prayers = selectedPrayers(settings);
  const beforeMap = (settings?.reminderMinutesByPrayer || {}) as Record<string, unknown>;
  const afterMap = (settings?.iqamaMinutesByPrayer || {}) as Record<string, unknown>;
  const beforeFallback = clampMinutes(settings?.reminderMinutes, 10);
  const afterFallback = clampMinutes(settings?.iqamaMinutes, 10);
  const remindersEnabled = settings?.remindersEnabled === true || settings?.reminderEnabled === true;
  const atAthan = settings?.prayerAlertEnabled === true || settings?.athanEnabled === true;
  const iqamaEnabled = settings?.iqamaEnabled === true;

  const planned: PlannedNotification[] = [];
  const add = (title: string, body: string, day: Date, totalMinutes: number, prayer: string, type: NotificationKind) => {
    const date = new Date(day);
    date.setMinutes(Math.round(totalMinutes));
    if (date.getTime() <= now.getTime()) return;
    planned.push({ title, body, date, prayer, type });
  };

  for (const day of days) {
    for (const prayer of prayers) {
      const parsed = parseHHMM(day.times?.[prayer]);
      if (!parsed) continue;
      const [h, m] = parsed;
      const athanMinutes = h * 60 + m;
      if (atAthan) {
        const msg = pickMessage(prayer, false, random);
        add(msg.title, msg.body, day.date, athanMinutes, prayer, "athan");
      }
      if (remindersEnabled) {
        const before = clampMinutes(beforeMap?.[prayer], beforeFallback);
        const msg = pickMessage(prayer, true, random);
        const suffix = settings?.language === "ar"
          ? ` (متبقي ${before} ${arabicPlural(before, "دقيقة", "دقيقتين", "دقائق")})`
          : ` (in ${before} min)`;
        add(`${msg.title}${suffix}`, msg.body, day.date, athanMinutes - before, prayer, "pre");
      }
      if (iqamaEnabled) {
        const after = clampMinutes(afterMap?.[prayer], afterFallback);
        const localized = PRAYER_NAMES_AR[prayer] || prayer;
        add(
          `إقامة صلاة ${localized}`,
          `حان وقت الإقامة — بعد ${after} ${arabicPlural(after, "دقيقة", "دقيقتين", "دقائق")} من الأذان.`,
          day.date, athanMinutes + after, prayer, "iqama",
        );
      }
    }
  }
  return planned;
}
