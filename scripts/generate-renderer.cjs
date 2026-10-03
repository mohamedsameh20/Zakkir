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

const bridge = fs.readFileSync(path.join(web, "bridge.js"), "utf8");

// Data the page reads at boot. Inlined so the app works fully offline.
const data = `
  document.documentElement.classList.add('zakkir-mobile');
  window.__ZAKKIR_AZKAR__ = ${azkar};
  window.__ZAKKIR_SOUNDS__ = ${JSON.stringify(soundsObj)};
`;

const mobileCss = fs.readFileSync(path.join(web, "mobile.css"), "utf8");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3,user-scalable=yes"/><style>${fonts}${css}${mobileCss}</style></head><body><div id="app"><div class="boot">Loading...</div></div><script>${scheduler.replace(/<\/script/gi, "<\\/script")}</script><script>${data}</script><script>${bridge}</script><script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
fs.writeFileSync(path.join(root, "renderer.generated.ts"), `export const rendererHtml = ${JSON.stringify(html)};\n`);
