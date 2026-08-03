import AsyncStorage from "@react-native-async-storage/async-storage";
import { AndroidHaptics, performAndroidHapticsAsync } from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { rendererHtml } from "./renderer.generated";

export default function App() {
  const webView = useRef<WebView>(null);
  const source = useMemo(() => ({ html: rendererHtml }), []);
  const topInset = Platform.OS === "android" ? NativeStatusBar.currentHeight || 0 : 0;
  const [themeBg, setThemeBg] = useState<string>("#f4f4f6");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState("home");

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
