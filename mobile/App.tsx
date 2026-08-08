import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import { AndroidHaptics, performAndroidHapticsAsync } from "expo-haptics";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, BackHandler, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { rendererHtml } from "./renderer.generated";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "prayer-reminders";
const SETTINGS_KEY = "zakkir.mobile.settings";
const SCHEDULE_KEY = "zakkir.mobile.notification-schedule";

function clampMinutes(value: unknown, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return Math.min(60, Math.max(1, fallback));
  return Math.min(60, n);
}

function parseHHMM(time: unknown): [number, number] | null {
  if (typeof time !== "string") return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return null;
  return [h, m];
}

const PRAYER_MESSAGES: Record<string, { title: string; body: string }[]> = {
  Fajr: [
    { title: "صلاة الفجر 🌅", body: "«أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَى غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا»" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "«رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "«بَشِّرِ الْمَشَّائِينَ فِي الظُّلَمِ إِلَى الْمَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ الْقِيَامَةِ» — سنن أبي داود والترمذي" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ» — متفق عليه" },
    { title: "صلاة الفجر 🌅", body: "«أَثْقَلُ الصَّلَاةِ عَلَى الْمُنَافِقِينَ صَلَاةُ الْعِشَاءِ وَصَلَاةُ الْفَجْرِ» — متفق عليه" },
    { title: "صلاة الفجر 🌅", body: "«لَنْ يَلِجَ النَّارَ أَحَدٌ صَلَّى قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "قال عمر رضي الله عنه: «لَأَنْ أَشْهَدَ صَلَاةَ الصُّبْحِ فِي الْجَمَاعَةِ أَحَبُّ إِلَيَّ مِنْ قِيَامِ لَيْلَةٍ»" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ بَاتَ طَاهِرًا بَاتَ فِي شِعَارِهِ مَلَكٌ... فَيَقُولُ الْمَلَكُ: اللَّهُمَّ اغْفِرْ لِعَبْدِكَ فُلَانٍ» — صحيح ابن حبان" }
  ],
  Dhuhr: [
    { title: "صلاة الظهر ☀️", body: "«وَمِنْ آنَاءِ اللَّيْلِ فَسَبِّحْ وَأَطْرَافَ النَّهَارِ لَعَلَّكَ تَرْضَى»" },
    { title: "صلاة الظهر ☀️", body: "«إِنَّ أَوَّلَ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ مِنْ عَمَلِهِ صَلَاتُهُ» — سنن الترمذي" },
    { title: "صلاة الظهر ☀️", body: "«إِذَا زَالَتِ الشَّمْسُ فُتِحَتْ أَبْوَابُ السَّمَاءِ... فَأُحِبُّ أَنْ يَصْعَدَ لِي فِيهِنَّ عَمَلٌ صَالِحٌ» — سنن الترمذي" },
    { title: "صلاة الظهر ☀️", body: "«أَرْبَعٌ قَبْلَ الظُّهْرِ لَيْسَ فِيهِنَّ تَسْلِيمٌ تُفْتَحُ لَهُنَّ أَبْوَابُ السَّمَاءِ» — سنن أبي داود" },
    { title: "صلاة الظهر ☀️", body: "«مَنْ حَافَظَ عَلَى أَرْبَعِ رَكَعَاتٍ قَبْلَ الظُّهْرِ وَأَرْبَعٍ بَعْدَهَا حَرَّمَهُ اللَّهُ عَلَى النَّارِ» — سنن الترمذي" }
  ],
  Asr: [
    { title: "صلاة العصر (الصلاة الوسطى) 🌤️", body: "«حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى وَقُومُوا لِلَّهِ قَانِتِينَ»" },
    { title: "صلاة العصر 🌤️", body: "«مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ» — صحيح البخاري" },
    { title: "صلاة العصر 🌤️", body: "«الَّذِي تَفُوتُهُ صَلَاةُ الْعَصْرِ كَأَنَّمَا وُتِرَ أَهْلَهُ وَمَالَهُ» — متفق عليه" },
    { title: "صلاة العصر 🌤️", body: "«مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ» — متفق عليه" },
    { title: "صلاة العصر 🌤️", body: "قال بريدة رضي الله عنه: «بَكِّرُوا بِصَلَاةِ الْعَصْرِ، فَإِنَّ النَّبِيَّ ﷺ قَالَ: مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ»" }
  ],
  Maghrib: [
    { title: "صلاة المغرب 🌅", body: "«وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ»" },
    { title: "صلاة المغرب 🌅", body: "«فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ»" },
    { title: "صلاة المغرب 🌅", body: "«لَا تَزَالُ أُمَّتِي بِخَيْرٍ - أَوْ عَلَى الْفِطْرَةِ - مَا لَمْ يُؤَخِّرُوا الْمَغْرِبَ حَتَّى تَشْتَبِكَ النُّجُومُ» — سنن أبي داود" },
    { title: "صلاة المغرب 🌅", body: "«إِذَا أَقْبَلَ اللَّيْلُ مِنْ هَا هُنَا، وَأَدْبَرَ النَّهَارُ مِنْ هَا هُنَا، وَغَرَبَتِ الشَّمْسُ، فَقَدْ أَفْطَرَ الصَّائِمُ» — متفق عليه" }
  ],
  Isha: [
    { title: "صلاة العشاء 🌙", body: "«وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَكَ عَسَى أَنْ يَبْعَثَكَ رَبُّكَ مَقَامًا مَحْمُودًا»" },
    { title: "صلاة العشاء 🌙", body: "«مَنْ شَهِدَ الْعِشَاءَ فِي جَمَاعَةٍ كَانَ لَهُ قِيَامُ نِصْفِ لَيْلَةٍ» — صحيح مسلم" },
    { title: "صلاة العشاء 🌙", body: "«لَوْ يَعْلَمُونَ مَا فِي الْعَتَمَةِ وَالصُّبْحِ لَأَتَوْهُمَا وَلَوْ حَبْوًا» — متفق عليه" },
    { title: "صلاة العشاء 🌙", body: "«كَانُوا قَلِيلًا مِنَ اللَّيْلِ مَا يَهْجَعُونَ * وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ»" }
  ]
};

const PRE_PRAYER_MESSAGES = [
  { title: "اقتراب موعد الصلاة ⏳", body: "«مَنْ تَطَهَّرَ فِي بَيْتِهِ، ثُمَّ مَشَى إِلَى بَيْتٍ مِنْ بُيُوتِ اللَّهِ... كَانَتْ خَطْوَتَاهُ إِحْدَاهُمَا تَحُطُّ خَطِيئَةً، وَالْأُخْرَى تَرْفَعُ دَرَجَةً» — صحيح مسلم" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«إِسْبَاغُ الْوُضُوءِ عَلَى الْمَكَارِهِ، وَكَثْرَةُ الْخُطَا إِلَى الْمَسَاجِدِ، وَانْتِظَارُ الصَّلَاةِ بَعْدَ الصَّلَاةِ... يَمْحُو اللَّهُ بِهِ الْخَطَايَا» — صحيح مسلم" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال معاذ رضي الله عنه: «إِذَا صَلَّيْتَ صَلَاةً، فَصَلِّ صَلَاةَ مُوَدِّعٍ، لَا تَظُنَّ أَنَّكَ تَعُودُ إِلَيْهَا أَبَدًا»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال وكيع بن الجراح رحمه الله: «مَنْ لَمْ يَأْخُذْ أُهْبَةَ الصَّلَاةِ قَبْلَ وَقْتِهَا لَمْ يَكُنْ وَقَّرَهَا»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«الدُّعَاءُ لَا يُرَدُّ بَيْنَ الْأَذَانِ وَالْإِقَامَةِ» — سنن الترمذي" },
  { title: "اقتراب موعد الصلاة ⏳", body: "كتب عمر رضي الله عنه لعماله: «إِنَّ أَهَمَّ أُمُورِكُمْ عِنْدِي الصَّلَاةُ، فَمَنْ حَفِظَهَا وَحَافَظَ عَلَيْهَا حَفِظَ دِينَهُ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "عن أنس بن مالك رضي الله عنه قال: قال رسول الله صلى الله عليه وسلم: «مَنْ صَلَّى لِلَّهِ أَرْبَعِينَ يَوْمًا فِي جَمَاعَةٍ يُدْرِكُ التَّكْبِيرَةَ الْأُولَى، كُتِبَتْ لَهُ بَرَاءَتَانِ: بَرَاءَةٌ مِنَ النَّارِ، وَبَرَاءَةٌ مِنَ النِّفَاقِ» — سنن الترمذي" },
  { title: "اقتراب موعد الصلاة ⏳", body: "عن مجاهد قال: «لَمَا فَاتَكَ مِنْهَا خَيْرٌ مِنْ مِائَةِ نَاقَةٍ كُلُّهَا سُودُ الْعَيْنِ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال إبراهيم التيمي رحمه الله: «إِذَا رَأَيْتَ الرَّجُلَ يَتَهَاوَنُ فِي التَّكْبِيرَةِ الْأُولَى فَاغْسِلْ يَدَكَ مِنْهُ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال وكيع بن الجراح رحمه الله: «مَنْ لَمْ يَأْخُذْ أُهْبَةَ الصَّلَاةِ قَبْلَ وَقْتِهَا لَمْ يَكُنْ وَقَّرَهَا، وَمَنْ تَهَاوَنَ بِالتَّكْبِيرَةِ الْأُولَى فَاغْسِلْ يَدَيْكَ مِنْهُ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال سفيان بن عيينة رحمه الله: «مِنْ تَوْقِيرِ الرَّجُلِ الصَّلَاةَ أَنْ يَأْتِيَ إِلَيْهَا قَبْلَ الْإِقَامَةِ»" }
];

function getRandomNotificationMessage(prayerName: string, isPre = false) {
  if (isPre) {
    const idx = Math.floor(Math.random() * PRE_PRAYER_MESSAGES.length);
    return PRE_PRAYER_MESSAGES[idx];
  }
  const list = PRAYER_MESSAGES[prayerName] || [];
  if (!list.length) {
    return { title: `صلاة ${prayerName}`, body: `حان الآن موعد صلاة ${prayerName}` };
  }
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

async function scheduleNotifications(times: Record<string, unknown>, settings: Record<string, unknown>) {
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
    if (!granted) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const prayers = Array.isArray(settings?.reminderPrayers)
      ? (settings.reminderPrayers as string[])
      : Object.entries((settings?.reminderPrayers || {}) as Record<string, unknown>)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([prayer]) => prayer);
    if (!prayers.length) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const beforeMap = (settings?.reminderMinutesByPrayer || {}) as Record<string, unknown>;
    const afterMap = (settings?.iqamaMinutesByPrayer || {}) as Record<string, unknown>;
    const beforeFallback = clampMinutes(settings?.reminderMinutes, 10);
    const afterFallback = clampMinutes(settings?.iqamaMinutes, 10);
    const remindersEnabled = settings?.remindersEnabled === true || settings?.reminderEnabled === true;
    const atAthan = settings?.prayerAlertEnabled === true || settings?.athanEnabled === true;
    const iqamaEnabled = settings?.iqamaEnabled === true;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const location = (settings?.location || {}) as Record<string, unknown>;
    const lat = Number(settings?.lat ?? location.lat);
    const lng = Number(settings?.lng ?? location.lng);
    const method = Number(settings?.method ?? location.method ?? 5);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Array<{ date: Date; times: Record<string, unknown> }> = [];

    // Prayer times move every day. Keep a three-day rolling set of one-shot
    // notifications (45 maximum) instead of repeating today's times forever.
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
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
    }
    if (!days.some(({ date }) => date.getTime() === today.getTime())) {
      days.unshift({ date: today, times });
    }

    const jobs: Promise<void>[] = [];
    const scheduleDate = (title: string, body: string, date: Date, totalMinutes: number, prayer: string, type: string) => {
      const triggerDate = new Date(date);
      triggerDate.setMinutes(Math.round(totalMinutes));
      if (triggerDate.getTime() <= Date.now()) return;
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title, body, sound: "default", data: { prayer, type } },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: CHANNEL_ID,
          },
        }).then(() => undefined),
      );
    };

    for (const day of days) {
      for (const prayer of prayers) {
        const parsed = parseHHMM(day.times?.[prayer]);
        if (!parsed) continue;
        const [h, m] = parsed;
        const athanMinutes = h * 60 + m;
        if (atAthan) {
          const msg = getRandomNotificationMessage(prayer, false);
          scheduleDate(msg.title, msg.body, day.date, athanMinutes, prayer, "athan");
        }
        if (remindersEnabled) {
          const before = clampMinutes(beforeMap?.[prayer], beforeFallback);
          const msgPre = getRandomNotificationMessage(prayer, true);
          scheduleDate(`${msgPre.title} (بعد ${before} دقيقة)`, msgPre.body, day.date, athanMinutes - before, prayer, "pre");
        }
        if (iqamaEnabled) {
          const after = clampMinutes(afterMap?.[prayer], afterFallback);
          scheduleDate(`إقامة صلاة ${prayer}`, `حان وقت الإقامة — بعد ${after} دقيقة من الأذان.`, day.date, athanMinutes + after, prayer, "iqama");
        }
      }
    }

    await Promise.all(jobs);
  } catch (_) {}
}

async function ensureChannel() {
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Prayer reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch (_) {}
}

export default function App() {
  const webView = useRef<WebView>(null);
  const topInset = Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0;
  const [themeBg, setThemeBg] = useState<string>("#f4f4f6");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState("home");
  const [palaceModelUri, setPalaceModelUri] = useState<string | null>(null);
  const lastSchedule = useRef<{ times: Record<string, unknown>; settings: Record<string, unknown> } | null>(null);
  const source = useMemo(() => {
    if (!palaceModelUri) return null;
    const slash = palaceModelUri.lastIndexOf("/");
    const baseUrl = slash >= 0 ? palaceModelUri.slice(0, slash + 1) : undefined;
    return {
      html: rendererHtml.replace("__ZAKKIR_PALACE_MODEL_URI__", JSON.stringify(palaceModelUri)),
      baseUrl,
    };
  }, [palaceModelUri]);

  useEffect(() => {
    ensureChannel();
    Asset.loadAsync(require("../gothic_palace_optimized.glb"))
      .then(([asset]) => {
        setPalaceModelUri(asset.uri.startsWith("http") ? asset.uri : (asset.localUri || asset.uri));
      })
      .catch((error) => console.warn("Could not prepare Gothic palace asset", error));
    AsyncStorage.getItem(SCHEDULE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        lastSchedule.current = saved;
        scheduleNotifications(saved.times || {}, saved.settings || {});
      } catch {
        AsyncStorage.removeItem(SCHEDULE_KEY);
      }
    });
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      const saved = lastSchedule.current;
      if (saved) scheduleNotifications(saved.times, saved.settings);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentView === "home") return false;
      webView.current?.injectJavaScript("window.__ZAKKIR_HANDLE_BACK__?.();true;");
      return true;
    });
    return () => subscription.remove();
  }, [currentView]);

  async function onMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "load-settings") {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        let value = {};
        if (raw) {
          try { value = JSON.parse(raw); }
          catch { await AsyncStorage.removeItem(SETTINGS_KEY); }
        }
        webView.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ type: "settings", value }))}}));true;`);
      } else if (message.type === "save-settings") {
        let current = {};
        try { current = JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY)) || "{}"); }
        catch { await AsyncStorage.removeItem(SETTINGS_KEY); }
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...message.patch }));
      } else if (message.type === "theme-color") {
        if (message.bg) setThemeBg(message.bg);
        if (typeof message.isDark === "boolean") setIsDarkTheme(message.isDark);
      } else if (message.type === "haptic") {
        try {
          const type = message.kind === "success"
            ? AndroidHaptics.Confirm
            : message.kind === "selection"
              ? AndroidHaptics.Segment_Tick
              : AndroidHaptics.Segment_Frequent_Tick;
          await performAndroidHapticsAsync(type);
        } catch (_) {}
      } else if (message.type === "view-change" && typeof message.view === "string") {
        setCurrentView(message.view);
      } else if (message.type === "garden-error") {
        console.warn("Three.js palace load failed", message.detail || "Unknown loader error", message.url || "");
      } else if (message.type === "schedule-notifications") {
        const times = message.times || {};
        const settings = message.settings || {};
        lastSchedule.current = { times, settings };
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify({ times, settings }));
        await scheduleNotifications(times, settings);
      }
    } catch (_) {}
  }

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar style={isDarkTheme ? "light" : "dark"} animated />
      <View style={{ height: topInset, backgroundColor: themeBg }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]}>
        {source ? (
          <WebView
            ref={webView}
            source={source}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            androidLayerType="hardware"
            onMessage={onMessage}
            onShouldStartLoadWithRequest={(request) => request.url === "about:blank" || request.url.startsWith("data:text/html") || request.url.startsWith("file:") || request.url.startsWith("http://") || request.url.startsWith("https://")}
            setSupportMultipleWindows={false}
            style={[styles.webview, { backgroundColor: themeBg }]}
          />
        ) : (
          <View style={styles.assetLoading}>
            <ActivityIndicator size="large" color="#2f6f61" />
            <Text style={styles.assetLoadingText}>Preparing palace…</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  webview: { flex: 1 },
  assetLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  assetLoadingText: { color: "#52665f", fontSize: 14, fontWeight: "600" },
});
