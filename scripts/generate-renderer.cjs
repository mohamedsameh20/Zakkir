const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const web = path.join(root, "web");
const css = fs.readFileSync(path.join(web, "popup.css"), "utf8");
const js = fs.readFileSync(path.join(web, "popup.js"), "utf8");
const scheduler = fs.readFileSync(path.join(web, "notification-scheduler.js"), "utf8");
const azkar = fs.readFileSync(path.join(web, "azkar.json"), "utf8");
const fontNames = [
  ["noto-naskh-arabic", "Noto Naskh Arabic"],
  ["amiri", "Amiri"],
  ["scheherazade-new", "Scheherazade New"],
  ["lateef", "Lateef"],
  ["mada", "Mada"],
  ["reem-kufi", "Reem Kufi"],
  ["aref-ruqaa", "Aref Ruqaa"],
  ["cairo", "Cairo"],
  ["tajawal", "Tajawal"],
  ["el-messiri", "El Messiri"],
];

const fonts = fontNames.map(([fileName, familyName]) => {
  const data = fs.readFileSync(path.join(web, "fonts", `${fileName}.ttf`)).toString("base64");
  return `@font-face{font-family:'${familyName}';src:url(data:font/ttf;base64,${data}) format('truetype');font-display:swap;}`;
}).join("");

const soundNames = require("./sounds.cjs").SOUND_IDS;
const soundsObj = {};
soundNames.forEach((name) => {
  const soundPath = path.join(web, "sounds", `${name}.mp3`);
  if (fs.existsSync(soundPath)) {
    const data = fs.readFileSync(soundPath).toString("base64");
    soundsObj[name] = `data:audio/mp3;base64,${data}`;
  }
});

// Android notification channels play audio from res/raw, not from the WebView,
// so the same MP3s are also mirrored into assets/sounds/ under Android-legal
// resource names (lowercase, underscores). The expo-notifications config plugin
// copies them into res/raw on prebuild.
require("./sounds.cjs").syncAndroidSoundAssets();

const bridge = `
  document.documentElement.classList.add('zakkir-mobile');
  window.__ZAKKIR_AZKAR__ = ${azkar};
  window.__ZAKKIR_SOUNDS__ = ${JSON.stringify(soundsObj)};
  (function() {
    var locale = String(window.__ZAKKIR_LOCALE__ || navigator.language || 'en');
    if (locale.toLowerCase().indexOf('ar') === 0) {
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.dir = 'rtl';
      var boot = document.querySelector('.boot');
      if (boot) boot.textContent = 'جارٍ التحميل…';
    }
  })();
  window.addEventListener('message', function(event) {
    try { var message = JSON.parse(event.data); if (message.type === 'settings' && window.__resolveSettings) window.__resolveSettings(message.value); } catch (_) {}
  });
  window.electronAPI = {
    loadSettings: function() { return new Promise(function(resolve) { var done = false; var finish = function(value) { if (done) return; done = true; clearTimeout(timer); window.__resolveSettings = null; resolve(value || {}); }; var timer = setTimeout(function() { finish({}); }, 3000); window.__resolveSettings = finish; window.ReactNativeWebView.postMessage(JSON.stringify({type:'load-settings'})); }); },
    saveSettings: function(patch) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'save-settings',patch:patch})); },
    setPrayerTimes: function(times, settings) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'schedule-notifications', times: times || {}, settings: settings || {}})); }
  };
  window.__ZAKKIR_HAPTIC__ = function(kind) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic',kind:kind || 'light'})); } catch (_) {}
  };
`;

const mobileCss = `
  html.zakkir-mobile body.electron {
    width: 100vw !important;
    min-height: 100vh !important;
    overflow-x: hidden;
    border: 0;
    box-shadow: none;
  }
  html.zakkir-mobile .app {
    padding: 12px 16px 104px;
    max-width: 760px;
    margin: 0 auto;
  }
  html.zakkir-mobile .home-view {
    gap: 12px;
  }
  html.zakkir-mobile .home-view > .header {
    display: none;
  }
  html.zakkir-mobile .app {
    animation: none;
  }
  /* ...unless JS marked this view root as newly entered, in which case the
     directional enter animation runs on the whole view. On mobile the view
     switch is instant — the previous slide/fade (even transform-only) still
     produced a blank flash because the 31-row schedule table takes >100 ms to
     layout on the WebView, and the animation kept it at translateY(6px) while
     the bottom nav (now a sibling) stayed fixed, reading as a flicker. */
  html.zakkir-mobile .app.contentEnter,
  html.zakkir-mobile .app.slideInFromStart,
  html.zakkir-mobile .app.slideInFromEnd { animation: none; }
  /* When the whole view animates as one unit, its children must not each run
     their own enter animation on top of it. */
  html.zakkir-mobile .app.contentEnter > *,
  html.zakkir-mobile .app.slideInFromStart > *,
  html.zakkir-mobile .app.slideInFromEnd > * {
    animation: none !important;
  }
  /* View-enter animation for the children of a freshly rendered view. Scoped so
     it only runs on mount: once a node carries an explicit state/enter class of
     its own, that class must win instead. */
  html.zakkir-mobile #app > .app > *:not(.mobile-bottom-nav):not(.contentEnter):not(.slideInFromStart):not(.slideInFromEnd) {
    animation: mobile-view-enter var(--dur-base) var(--ease-out);
  }
  @keyframes mobile-view-enter {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }
  /* Settings tabs are an in-place switch inside the same view. The view-
     enter fade makes the section flash blank then re-appear, which reads as
     a whole-page re-render. Keep it instant on mobile. */
  html.zakkir-mobile .settings-section { animation: none !important; }
  /* Deliberately quiet: tapping the azkar box must NOT shake the card, so the
     desktop .pulse keyframes are suppressed here on purpose. Finishing a
     dhikr's count still gets the restrained .azkar-complete acknowledgement. */
  html.zakkir-mobile #app > .app > .azkar-card.pulse {
    animation: none;
  }
  html.zakkir-mobile #app > .app > .azkar-card.azkar-complete {
    animation: azkar-complete-pulse 0.42s var(--ease-out);
  }
  html.zakkir-mobile .prayer-card {
    padding: 14px;
    transition: padding var(--dur-slow) var(--ease-out), background-color var(--dur-base) var(--ease-out);
  }
  html.zakkir-mobile .prayer-progress > div {
    transition: transform 0.7s var(--ease-out);
  }
  html.zakkir-mobile .prayer-head { margin-bottom: 10px; }
  html.zakkir-mobile .prayer-grid { gap: 4px; }
  html.zakkir-mobile .prayer {
    min-height: 48px;
    padding-inline: 1px;
  }
  html.zakkir-mobile .prayer-meta {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  html.zakkir-mobile .prayer-collapse {
    /* 28px visual circle, expanded to a 44px hit area via ::after so the
       touch target meets WCAG 2.5.8 without changing the layout. */
    position: relative;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--muted);
    background: color-mix(in oklab, var(--surface) 70%, transparent);
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-press) var(--ease-out);
  }
  html.zakkir-mobile .prayer-collapse::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }
  html.zakkir-mobile .prayer-collapse:active {
    transform: scale(0.9);
    background: color-mix(in oklab, var(--accent) 14%, var(--surface));
  }
  html.zakkir-mobile .prayer-collapse svg {
    width: 15px;
    height: 15px;
    transition: transform var(--dur-slow) var(--ease-out);
  }
  html.zakkir-mobile .prayer-collapse[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }
  html.zakkir-mobile .prayer-card.is-collapsed {
    padding: 10px 12px;
  }
  /* ---- The morph itself ----
     One persistent .next-name / .next-countdown. Collapsing only shrinks them,
     so the text scales smoothly instead of two copies cross-fading. All three
     properties share --dur-slow/--ease-out with the height + padding above. */
  html.zakkir-mobile .prayer-head {
    transition: margin-bottom var(--dur-slow) var(--ease-out);
  }
  html.zakkir-mobile .next-line {
    transition: margin-bottom var(--dur-slow) var(--ease-out);
  }
  html.zakkir-mobile .next-name,
  html.zakkir-mobile .next-countdown strong {
    transition: font-size var(--dur-slow) var(--ease-out);
  }
  html.zakkir-mobile .next-prayer {
    align-items: baseline;
    transition: gap var(--dur-slow) var(--ease-out);
  }
  html.zakkir-mobile .hijri {
    transition: opacity var(--dur-base) var(--ease-out), max-width var(--dur-slow) var(--ease-out);
    opacity: 1;
    max-width: 16ch;
    overflow: hidden;
    white-space: nowrap;
  }
  html.zakkir-mobile .prayer-card.is-collapsed .prayer-head { margin-bottom: 0; }
  html.zakkir-mobile .prayer-card.is-collapsed .next-line { margin-bottom: 2px; }
  html.zakkir-mobile .prayer-card.is-collapsed .next-name { font-size: 1.05em; }
  html.zakkir-mobile .prayer-card.is-collapsed .next-countdown strong { font-size: 0.9em; }
  html.zakkir-mobile .prayer-card.is-collapsed .hijri {
    opacity: 0;
    max-width: 0;
  }
  html.zakkir-mobile .azkar-card {
    min-height: 282px;
    padding: 15px 16px 14px;
    touch-action: pan-y;
    transform: translateX(0);
    transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    will-change: transform;
  }
  html.zakkir-mobile .azkar-card.is-swiping {
    transition: none;
    box-shadow: 0 12px 28px color-mix(in oklab, var(--accent) 18%, transparent);
  }
  html.zakkir-mobile .azkar-card.azkar-complete {
    animation: azkar-complete-pulse 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  }
  html.zakkir-mobile .azkar-card.azkar-complete .azkar-current-progress > div {
    animation: azkar-complete-shine 0.42s ease-out;
  }
  @keyframes azkar-complete-pulse {
    0% { transform: scale(1); }
    45% { transform: scale(1.012); box-shadow: 0 13px 30px color-mix(in oklab, var(--accent) 24%, transparent); }
    100% { transform: scale(1); }
  }
  @keyframes azkar-complete-shine {
    0% { filter: brightness(1); }
    45% { filter: brightness(1.55) saturate(1.25); }
    100% { filter: brightness(1); }
  }
  html.zakkir-mobile .azkar-context {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) 54px;
    min-height: 28px;
    margin: 0 0 5px;
    padding: 0;
  }
  html.zakkir-mobile .azkar-context-balance {
    grid-column: 1;
    width: 54px;
  }
  html.zakkir-mobile .azkar-context .counter {
    grid-column: 3;
    justify-self: end;
    min-width: 52px;
    padding: 4px 9px;
    box-shadow: none;
    font-size: 0.72em;
  }
  html.zakkir-mobile .azkar-current-progress {
    position: relative;
    z-index: 1;
    height: 5px;
    margin-bottom: 2px;
  }
  html.zakkir-mobile .azkar-context-copy {
    grid-column: 2;
    min-width: 0;
    text-align: center;
    letter-spacing: 0.02em;
  }
  html.zakkir-mobile .azkar-context-copy strong {
    color: var(--accent);
    font-size: 1em;
  }
  html.zakkir-mobile .dhikr {
    min-height: 118px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 4px 8px;
    text-align: center;
    line-height: 1.9;
  }
  html.zakkir-mobile .dhikr-preamble {
    margin-top: 3px;
  }
  html.zakkir-mobile .desc {
    padding-top: 7px;
    font-size: 0.86em;
    line-height: 1.65;
  }
  html.zakkir-mobile .azkar-progress-footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
  }
  html.zakkir-mobile .azkar-progress-label {
    font-size: 0.74em;
  }
  html[dir="rtl"].zakkir-mobile .azkar-progress-label {
    font-size: 0.85em;
    letter-spacing: 0;
  }
  html[dir="rtl"].zakkir-mobile .eyebrow {
    font-size: 0.86em;
    letter-spacing: 0;
  }
  html.zakkir-mobile .azkar-progress-track {
    height: 8px;
  }
  html.zakkir-mobile .azkar-controls {
    grid-template-columns: 1fr 44px 1fr;
    align-items: center;
    gap: 8px;
    padding: 0;
  }
  html.zakkir-mobile .azkar-controls .nav-btn[data-nav] {
    min-width: 0;
    min-height: 44px;
    border-radius: 12px;
    padding: 7px 12px;
  }
  html.zakkir-mobile .azkar-controls .nav-btn[data-nav="-1"] { justify-content: flex-start; }
  html.zakkir-mobile .azkar-controls .nav-btn[data-nav="1"] { justify-content: flex-end; }
  html.zakkir-mobile .azkar-controls .reset-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border-radius: 12px;
  }
  html.zakkir-mobile .azkar-controls .reset-btn span { display: none; }
  html.zakkir-mobile .azkar-controls .reset-btn svg {
    width: 16px;
    height: 16px;
  }
  html.zakkir-mobile .azkar-controls[data-nav-mode="swipe-only"] {
    grid-template-columns: auto;
    justify-content: center;
  }
  html.zakkir-mobile .azkar-controls[data-nav-mode="swipe-only"] [data-nav] {
    display: none;
  }
  html.zakkir-mobile .azkar-navigation-setting {
    align-items: stretch;
    flex-direction: column;
    gap: 7px;
  }
  html.zakkir-mobile .azkar-navigation-setting .seg {
    width: 100%;
  }
  html.zakkir-mobile .azkar-navigation-setting .seg-btn {
    padding: 7px 5px;
    font-size: 0.7em;
  }
  html.zakkir-mobile .sched-table-wrap,
  html.zakkir-mobile .settings-body {
    padding-bottom: 110px !important;
  }
  html.zakkir-mobile .mobile-bottom-nav {
    position: fixed;
    bottom: 14px;
    left: 16px;
    right: 16px;
    max-width: 500px;
    margin: 0 auto;
    z-index: 9999;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 6px;
    isolation: isolate;
    overflow: hidden;
    background: color-mix(in oklab, var(--surface) 55%, transparent);
    border: 1px solid color-mix(in oklab, var(--line) 85%, transparent);
    border-radius: 22px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(28px) saturate(1.4);
    pointer-events: auto !important;
    transform: translateZ(0);
  }
  html.zakkir-mobile .mobile-bottom-nav-btn {
    position: relative;
    isolation: isolate;
    min-height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border: 0;
    overflow: hidden;
    border-radius: 16px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.66em;
    font-weight: 650;
    pointer-events: auto !important;
    touch-action: manipulation;
    transition: color 0.3s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  html.zakkir-mobile .mobile-nav-liquid {
    position: absolute;
    z-index: 0;
    top: 6px;
    bottom: 6px;
    left: 6px;
    width: calc((100% - 24px) / 3);
    display: block;
    border-radius: 16px;
    background: linear-gradient(135deg, color-mix(in oklab, var(--accent) 84%, white), color-mix(in oklab, var(--accent) 96%, transparent));
    box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.45), 0 8px 22px color-mix(in oklab, var(--accent) 28%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 18%, transparent);
    pointer-events: none;
    transform: translateX(calc(var(--nav-index, 0) * (100% + 6px)));
    transition: transform 0.44s cubic-bezier(0.34, 1.45, 0.64, 1);
    will-change: transform;
  }
  html.zakkir-mobile .mobile-nav-liquid::after {
    content: "";
    position: absolute;
    inset: 1px 12% 50%;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
    opacity: 0.35;
    filter: blur(0.5px);
  }
  html.zakkir-mobile .mobile-nav-icon,
  html.zakkir-mobile .mobile-nav-label {
    position: relative;
    z-index: 1;
  }
  html.zakkir-mobile .mobile-nav-icon {
    display: grid;
    place-items: center;
    transition: transform 0.32s cubic-bezier(0.2, 0.9, 0.25, 1.2);
  }
  html.zakkir-mobile .mobile-nav-label {
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease;
  }
  html.zakkir-mobile .mobile-bottom-nav-btn svg {
    width: 19px;
    height: 19px;
  }
  html.zakkir-mobile .mobile-bottom-nav-btn.active {
    color: var(--accent-ink);
  }
  html.zakkir-mobile .mobile-bottom-nav-btn.active .mobile-nav-icon {
    transform: translateY(-1px) scale(1.08);
  }
  html.zakkir-mobile .mobile-bottom-nav-btn.active .mobile-nav-label {
    transform: translateY(1px);
  }
  html.zakkir-mobile .mobile-bottom-nav-btn:active {
    transform: scale(0.94);
  }
  html.zakkir-mobile .mobile-bottom-nav-btn:active .mobile-nav-icon {
    transform: scale(0.9);
  }
  @media (prefers-reduced-motion: reduce) {
    html.zakkir-mobile .mobile-bottom-nav-btn,
    html.zakkir-mobile .mobile-nav-icon,
    html.zakkir-mobile .mobile-nav-label { transition-duration: 0.01ms; }
    html.zakkir-mobile .mobile-nav-liquid { transition-duration: 0.01ms; }
  }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3,user-scalable=yes"/><style>${fonts}${css}${mobileCss}</style></head><body><div id="app"><div class="boot">Loading...</div></div><script>${scheduler.replace(/<\/script/gi, "<\\/script")}</script><script>${bridge}</script><script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
fs.writeFileSync(path.join(root, "renderer.generated.ts"), `export const rendererHtml = ${JSON.stringify(html)};\n`);
