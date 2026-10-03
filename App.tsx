import AsyncStorage from "@react-native-async-storage/async-storage";
import { AndroidHaptics, performAndroidHapticsAsync } from "expo-haptics";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, I18nManager, LogBox, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { rendererHtml } from "./renderer.generated";
import { deliverScript, parseWebMessage } from "./src/bridge.ts";
import { ensureChannels, scheduleNotifications } from "./src/notifications/schedule.ts";

// Hide the known Expo Go-only warning ("push notifications removed in SDK 53")
// so LogBox banners don't cover the UI in screenshots. Real dev/prod builds
// are unaffected (the warning never fires there).
LogBox.ignoreLogs(["expo-notifications"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SETTINGS_KEY = "zakkir.mobile.settings";
const SCHEDULE_KEY = "zakkir.mobile.notification-schedule";

// Origin assigned to the injected renderer document. Nothing is ever fetched
// from it; it exists so the page has a non-opaque origin, because Chromium
// denies geolocation to documents loaded with an empty baseUrl.
const RENDERER_BASE_URL = "https://zakkir.local/";

function getDeviceLanguage(): string {
  try {
    const c = I18nManager.getConstants() as Record<string, unknown>;
    const locale = String(c.localeIdentifier || c.locale || "").replace(/_/g, "-");
    if (locale) return locale;
  } catch {}
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale) return locale;
  } catch {}
  return "en";
}

export default function App() {
  const webView = useRef<WebView>(null);
  const rendererVersion = useMemo(() => Date.now(), [rendererHtml]);
  // The HTML is injected rather than served, but it still needs a real origin:
  // Chromium treats a document loaded with an empty baseUrl as opaque and
  // silently denies geolocation to it, which breaks the "Detect" button. Any
  // stable https origin is enough, and nothing is ever fetched from it because
  // onShouldStartLoadWithRequest blocks navigation.
  const source = useMemo(() => ({ html: rendererHtml, baseUrl: RENDERER_BASE_URL }), [rendererHtml]);
  const topInset = Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0;
  const [themeBg, setThemeBg] = useState<string>("#f4f4f6");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState("home");
  const lastSchedule = useRef<{ times: Record<string, unknown>; settings: Record<string, unknown> } | null>(null);

  useEffect(() => {
    // Channels must exist before anything is scheduled against them, otherwise
    // Android drops the notification's channel and falls back to the default.
    const restored = ensureChannels().then(async () => {
      const raw = await AsyncStorage.getItem(SCHEDULE_KEY);
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        lastSchedule.current = saved;
        await scheduleNotifications(saved.times || {}, saved.settings || {});
      } catch {
        await AsyncStorage.removeItem(SCHEDULE_KEY);
      }
    });
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      restored.then(() => {
        const saved = lastSchedule.current;
        if (saved) scheduleNotifications(saved.times, saved.settings);
      });
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentView === "home") return false;
      webView.current?.injectJavaScript(deliverScript({ type: "back" }));
      return true;
    });
    return () => subscription.remove();
  }, [currentView]);

  async function onMessage(event: WebViewMessageEvent) {
    const message = parseWebMessage(event.nativeEvent.data);
    if (!message) return;
    try {
      switch (message.type) {
        case "load-settings": {
          const raw = await AsyncStorage.getItem(SETTINGS_KEY);
          let value = {};
          if (raw) {
            try { value = JSON.parse(raw); }
            catch { await AsyncStorage.removeItem(SETTINGS_KEY); }
          }
          webView.current?.injectJavaScript(deliverScript({ type: "settings", value, locale: getDeviceLanguage() }));
          break;
        }
        case "save-settings": {
          let current = {};
          try { current = JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY)) || "{}"); }
          catch { await AsyncStorage.removeItem(SETTINGS_KEY); }
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...message.patch }));
          break;
        }
        case "theme-color":
          if (message.bg) setThemeBg(message.bg);
          if (message.isDark !== undefined) setIsDarkTheme(message.isDark);
          break;
        case "haptic": {
          const type = message.kind === "success"
            ? AndroidHaptics.Confirm
            : message.kind === "selection"
              ? AndroidHaptics.Segment_Tick
              : AndroidHaptics.Segment_Frequent_Tick;
          await performAndroidHapticsAsync(type);
          break;
        }
        case "view-change":
          setCurrentView(message.view);
          break;
        case "schedule-notifications": {
          const { times, settings } = message;
          lastSchedule.current = { times, settings };
          await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify({ times, settings }));
          await scheduleNotifications(times, settings);
          break;
        }
      }
    } catch (_) {}
  }

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar style={isDarkTheme ? "light" : "dark"} animated />
      <View style={{ height: topInset, backgroundColor: themeBg }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]}>
        <WebView
          key={rendererVersion}
          ref={webView}
          source={source}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          // Lets popup.js call navigator.geolocation for the "Detect" button.
          // react-native-webview requests ACCESS_FINE_LOCATION from Android on
          // demand, so no separate location module is needed.
          geolocationEnabled
          cacheEnabled={false}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={(request) =>
            request.url === "about:blank" ||
            request.url.startsWith("data:text/html") ||
            request.url.startsWith(RENDERER_BASE_URL)
          }
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
