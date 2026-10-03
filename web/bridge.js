// Bridge between this page and the native shell (App.tsx). Every message in
// either direction goes through window.ZakkirNative; src/bridge.ts types the
// same protocol on the native side, so change both together.
//
// Page -> native: ZakkirNative.<method>() posts a JSON message.
// Native -> page: the shell injects ZakkirNative.receive({ type, ... }).
(function () {
  function post(message) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(message)); } catch (_) {}
  }

  var pendingSettings = null;

  var native = {
    // Device locale, delivered with the settings. Empty until then.
    locale: "",
    // Set by the page: returns true when it handled the back press itself.
    onBack: null,

    loadSettings: function () {
      return new Promise(function (resolve) {
        var done = false;
        // Resolve with defaults if the shell never answers.
        var timer = setTimeout(function () { finish({}); }, 3000);
        function finish(value) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          pendingSettings = null;
          resolve(value || {});
        }
        pendingSettings = finish;
        post({ type: "load-settings" });
      });
    },
    saveSettings: function (patch) { post({ type: "save-settings", patch: patch }); },
    scheduleNotifications: function (times, settings) {
      post({ type: "schedule-notifications", times: times || {}, settings: settings || {} });
    },
    haptic: function (kind) { post({ type: "haptic", kind: kind || "light" }); },
    themeColor: function (bg, isDark) { post({ type: "theme-color", bg: bg, isDark: isDark }); },
    viewChanged: function (view) { post({ type: "view-change", view: view }); },

    receive: function (message) {
      if (!message) return;
      if (message.type === "settings") {
        if (message.locale) native.locale = String(message.locale);
        if (pendingSettings) pendingSettings(message.value);
      } else if (message.type === "back") {
        if (native.onBack) native.onBack();
      }
    },
  };
  window.ZakkirNative = native;

  // Pick the boot text direction before the app renders. The device locale
  // only arrives with the settings, so this uses the WebView's language.
  if (String(navigator.language || "en").toLowerCase().indexOf("ar") === 0) {
    document.documentElement.setAttribute("lang", "ar");
    document.documentElement.dir = "rtl";
    var boot = document.querySelector(".boot");
    if (boot) boot.textContent = "جارٍ التحميل…";
  }
})();
