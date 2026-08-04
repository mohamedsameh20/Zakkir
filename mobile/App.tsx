import AsyncStorage from "@react-native-async-storage/async-storage";
import { AndroidHaptics, performAndroidHapticsAsync } from "expo-haptics";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from "react-native";
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

    const prayers = Array.isArray(settings?.reminderPrayers) ? (settings.reminderPrayers as string[]) : [];
    if (!prayers.length) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const beforeMap = (settings?.reminderMinutesByPrayer || {}) as Record<string, unknown>;
    const afterMap = (settings?.iqamaMinutesByPrayer || {}) as Record<string, unknown>;
    const beforeFallback = clampMinutes(settings?.reminderMinutes, 10);
    const afterFallback = clampMinutes(settings?.iqamaMinutes, 10);
    const atAthan = settings?.prayerAlertEnabled === true;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const jobs: Promise<void>[] = [];
    const scheduleDaily = (title: string, body: string, totalMinutes: number) => {
      const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
      const hour = Math.floor(normalized / 60);
      const minute = normalized % 60;
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title, body, sound: "default" },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        }).then(() => undefined),
      );
    };

    for (const prayer of prayers) {
      const parsed = parseHHMM(times?.[prayer]);
      if (!parsed) continue;
      const [h, m] = parsed;
      const athanMinutes = h * 60 + m;
      if (atAthan) {
        scheduleDaily(`${prayer} time`, `It's time for ${prayer}.`, athanMinutes);
      }
      const before = clampMinutes(beforeMap?.[prayer], beforeFallback);
      scheduleDaily(`${prayer} reminder`, `${before} minutes until ${prayer}.`, athanMinutes - before);
      const after = clampMinutes(afterMap?.[prayer], afterFallback);
      scheduleDaily(`${prayer} iqama`, `${after} minutes after ${prayer}.`, athanMinutes + after);
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
  const source = useMemo(() => ({ html: rendererHtml }), []);
  const topInset = Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0;
  const [themeBg, setThemeBg] = useState<string>("#f4f4f6");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    ensureChannel();
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
        const raw = await AsyncStorage.getItem("zakkir.mobile.settings");
        let value = {};
        if (raw) {
          try { value = JSON.parse(raw); }
          catch { await AsyncStorage.removeItem("zakkir.mobile.settings"); }
        }
        webView.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ type: "settings", value }))}}));true;`);
      } else if (message.type === "save-settings") {
        let current = {};
        try { current = JSON.parse((await AsyncStorage.getItem("zakkir.mobile.settings")) || "{}"); }
        catch { await AsyncStorage.removeItem("zakkir.mobile.settings"); }
        await AsyncStorage.setItem("zakkir.mobile.settings", JSON.stringify({ ...current, ...message.patch }));
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
      } else if (message.type === "schedule-notifications") {
        await scheduleNotifications(message.times || {}, message.settings || {});
      }
    } catch (_) {}
  }

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar style={isDarkTheme ? "light" : "dark"} animated />
      <View style={{ height: topInset, backgroundColor: themeBg }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]}>
        <WebView
          ref={webView}
          source={source}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          onShouldStartLoadWithRequest={(request) => request.url === "about:blank" || request.url.startsWith("data:text/html")}
          setSupportMultipleWindows={false}
          style={[styles.webview, { backgroundColor: themeBg }]}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  webview: { flex: 1 },
});
