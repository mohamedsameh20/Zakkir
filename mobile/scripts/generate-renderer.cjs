const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "../..");
const mobile = path.resolve(__dirname, "..");
const gardenBundlePath = path.join(root, "garden", "garden.bundle.js");
esbuild.buildSync({
  entryPoints: [path.join(root, "garden", "garden-entry.js")],
  bundle: true,
  format: "iife",
  globalName: "ZakkirGarden",
  outfile: gardenBundlePath,
  platform: "browser",
  target: ["chrome100"],
  minify: true,
  nodePaths: [path.join(mobile, "node_modules")],
  logLevel: "silent",
});
const css = fs.readFileSync(path.join(root, "popup.css"), "utf8");
const js = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const scheduler = fs.readFileSync(path.join(root, "notification-scheduler.js"), "utf8");
const azkar = fs.readFileSync(path.join(root, "azkar.json"), "utf8");
const gardenBundle = fs.readFileSync(gardenBundlePath, "utf8");
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
  const data = fs.readFileSync(path.join(root, "fonts", `${fileName}.ttf`)).toString("base64");
  return `@font-face{font-family:'${familyName}';src:url(data:font/ttf;base64,${data}) format('truetype');font-display:swap;}`;
}).join("");

const soundNames = ["adhan-1", "adhan-2", "chime", "bell", "soft-ping"];
const soundsObj = {};
soundNames.forEach((name) => {
  const soundPath = path.join(root, "sounds", `${name}.mp3`);
  if (fs.existsSync(soundPath)) {
    const data = fs.readFileSync(soundPath).toString("base64");
    soundsObj[name] = `data:audio/mp3;base64,${data}`;
  }
});

const patchedJs = js
  .replace(/const url = globalThis\.chrome\?\.runtime\?\.getURL \? chrome\.runtime\.getURL\("azkar\.json"\) : "azkar\.json";/, "const url = 'data:application/json,' + encodeURIComponent(JSON.stringify(window.__ZAKKIR_AZKAR__));")
  .replace("const raw = localStorage.getItem(\"azkar\");", "const raw = localStorage.getItem(\"azkar\");");

const bridge = `
  window.__ZAKKIR_MOBILE__ = true;
  document.documentElement.classList.add('zakkir-mobile');
  window.__ZAKKIR_AZKAR__ = ${azkar};
  window.__ZAKKIR_SOUNDS__ = ${JSON.stringify(soundsObj)};
  window.__ZAKKIR_PALACE_MODEL_URL__ = __ZAKKIR_PALACE_MODEL_URI__;
  window.addEventListener('message', function(event) {
    try {
      var message = JSON.parse(event.data);
      if (message.type === 'settings' && window.__resolveSettings) window.__resolveSettings(message.value);
      if (message.type === 'palace-model' && message.value) {
        window.__ZAKKIR_PALACE_MODEL_URL__ = message.value;
        window.ZakkirGarden?.setModelUrl(message.value);
      }
    } catch (_) {}
  });
  window.electronAPI = {
    loadSettings: function() { return new Promise(function(resolve) { var done = false; var finish = function(value) { if (done) return; done = true; clearTimeout(timer); window.__resolveSettings = null; resolve(value || {}); }; var timer = setTimeout(function() { finish({}); }, 3000); window.__resolveSettings = finish; window.ReactNativeWebView.postMessage(JSON.stringify({type:'load-settings'})); }); },
    saveSettings: function(patch) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'save-settings',patch:patch})); },
    setPrayerTimes: function(times, settings) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'schedule-notifications', times: times || {}, settings: settings || {}})); }, signalReady: function() {}, onPlaySound: function() {}, onUpdateAvailable: function() {},
    openExternal: function() {}, resizeWindow: function() {}, setAlwaysOnTop: function() {}, minimizeWindow: function() {}, closeWindow: function() {}
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
  html.zakkir-mobile #app > .app > *:not(.mobile-bottom-nav) {
    animation: mobile-view-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes mobile-view-enter {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }
  html.zakkir-mobile .prayer-card:not(.is-collapsed) .prayer-collapsed-row {
    display: none !important;
  }
  html.zakkir-mobile .prayer-card {
    padding: 14px;
    transition: padding 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease;
  }
  html.zakkir-mobile .prayer-collapsed-row,
  html.zakkir-mobile .prayer-hero,
  html.zakkir-mobile .prayer-grid {
    animation: prayer-content-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes prayer-content-enter {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: none; }
  }
  html.zakkir-mobile .prayer-progress > div {
    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  html.zakkir-mobile .prayer-hero { margin-bottom: 10px; }
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
  }
  html.zakkir-mobile .prayer-collapse svg {
    width: 15px;
    height: 15px;
    transition: transform 0.18s ease;
  }
  html.zakkir-mobile .prayer-collapse[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }
  html.zakkir-mobile .prayer-card.is-collapsed {
    padding: 10px 12px;
  }
  html.zakkir-mobile .prayer-collapsed-row {
    min-height: 42px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  html.zakkir-mobile .prayer-collapsed-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  html.zakkir-mobile .prayer-collapsed-main strong {
    font-size: 1.05em;
  }
  html.zakkir-mobile .prayer-collapsed-countdown {
    color: var(--accent);
    font-size: 0.9em;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
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
    font-size: 0.66em;
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
    min-height: 40px;
    border-radius: 12px;
    padding: 7px 12px;
  }
  html.zakkir-mobile .azkar-controls .nav-btn[data-nav="-1"] { justify-content: flex-start; }
  html.zakkir-mobile .azkar-controls .nav-btn[data-nav="1"] { justify-content: flex-end; }
  html.zakkir-mobile .azkar-controls .reset-btn {
    width: 44px;
    min-width: 44px;
    min-height: 40px;
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
    z-index: 999999 !important;
    left: 14px;
    right: 14px;
    bottom: max(8px, env(safe-area-inset-bottom));
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 7px;
    isolation: isolate;
    overflow: hidden;
    background: color-mix(in oklab, var(--surface) 48%, transparent);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(24px) saturate(1.3);
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
    border-radius: 14px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.66em;
    font-weight: 650;
    pointer-events: auto !important;
    touch-action: manipulation;
    transition: color 0.28s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  html.zakkir-mobile .mobile-nav-liquid {
    position: absolute;
    z-index: 0;
    top: 7px;
    bottom: 7px;
    left: 7px;
    width: calc((100% - 38px) / 4);
    display: block;
    border-radius: 14px;
    background: linear-gradient(135deg, color-mix(in oklab, var(--accent) 76%, white), color-mix(in oklab, var(--accent) 94%, transparent));
    box-shadow: inset 0 1px 0 color-mix(in oklab, white 35%, transparent), 0 7px 16px color-mix(in oklab, var(--accent) 18%, transparent);
    pointer-events: none;
    transform: translateX(calc(var(--nav-index, 0) * (100% + 8px)));
    transition: transform 0.52s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }
  html.zakkir-mobile .mobile-nav-liquid::after {
    content: "";
    position: absolute;
    inset: 1px 12% 52%;
    border-radius: 999px;
    background: linear-gradient(180deg, color-mix(in oklab, white 28%, transparent), transparent);
    opacity: 0.72;
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

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3,user-scalable=yes"/><style>${fonts}${css}${mobileCss}</style></head><body><div id="app"><div class="boot">Loading...</div></div><script>${scheduler.replace(/<\/script/gi, "<\\/script")}</script><script>${bridge}</script><script>${gardenBundle.replace(/<\/script/gi, "<\\/script")}</script><script>${patchedJs.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
fs.writeFileSync(path.join(mobile, "renderer.generated.ts"), `export const rendererHtml = ${JSON.stringify(html)};\n`);
