// Azkar Extension — Prayer Times + Azkar (Hisn al-Muslim)
// Prayer times: api.aladhan.com (timingsByCity)
// Azkar:        bundled azkar.json (Hisn al-Muslim, nawafalqari/azkar-api)

const DEFAULTS = {
  view: "home",
  font: "Noto Naskh Arabic",
  arSize: 1.0,
  zoom: 1.0,
  popupW: 420,
  popupH: 580,
  theme: "dark",
  palette: "default",
  city: "Cairo",
  country: "Egypt",
  method: 5,
  category: "أذكار الصباح",
  autoTime: true,
  azkarIndex: 0,
  azkarCount: 0,
  azkarResetDate: null,
  prayerCache: null,
  isElectronPinned: false,
};

const FONT_MAP = {
  "Noto Naskh Arabic": '"Noto Naskh Arabic", serif',
  Amiri: '"Amiri", serif',
  Scheherazade: '"Scheherazade New", serif',
  Lateef: '"Lateef", serif',
  Mada: '"Mada", sans-serif',
  "Reem Kufi": '"Reem Kufi", sans-serif',
  "Aref Ruqaa": '"Aref Ruqaa", serif',
  Cairo: '"Cairo", sans-serif',
  Tajawal: '"Tajawal", sans-serif',
  "El Messiri": '"El Messiri", sans-serif',
};

// Minimal themes — no gradients, clean surfaces
const THEMES = [
  // Light
  ["light",     "Light"],
  ["paper",     "Paper"],
  ["linen",     "Linen"],
  ["fog",       "Fog"],
  ["sky-l",     "Sky Light"],
  ["mint-l",    "Mint Cream"],
  ["sage-l",    "Sage"],
  ["sepia",     "Sepia"],
  ["solar-l",   "Solarized Light"],
  ["gruv-l",    "Gruvbox Light"],
  ["rosepine-d","Rosé Pine Dawn"],
  ["latte",     "Catppuccin Latte"],
  ["rose-l",    "Rose Quartz"],
  ["lavender-l","Lavender"],
  ["peach-l",   "Peach"],
  ["lemon-l",   "Lemon"],
  // Dark
  ["dark",      "Dark"],
  ["midnight",  "Midnight"],
  ["slate",     "Slate"],
  ["coffee",    "Coffee"],
  ["nord",      "Nord"],
  ["dracula",   "Dracula"],
  ["gruv-d",    "Gruvbox Dark"],
  ["solar-d",   "Solarized Dark"],
  ["rosepine",  "Rosé Pine"],
  ["mocha",     "Catppuccin Mocha"],
  ["tokyo",     "Tokyo Night"],
  ["forest",    "Forest"],
  ["ocean",     "Ocean"],
  ["mono",      "Mono"],
  ["terminal",  "Terminal"],
  ["obsidian",  "Obsidian"],
  ["carbon",    "Carbon"],
  ["cyberpunk", "Cyberpunk"],
  ["matrix",    "Matrix"],
  ["wine",      "Wine"],
];

// Extensive palette — single accent color, mix of vivid and soft/light tones
const PALETTES = {
  default:   { name: "Theme default" },
  // Light / pastel
  powderblue:{ name: "Powder Blue",  a: "#bfdbfe" },
  babyblue:  { name: "Baby Blue",    a: "#cfe6ff" },
  skylight:  { name: "Sky Light",    a: "#bae6fd" },
  aqualight: { name: "Aqua Light",   a: "#99f6e4" },
  seafoam:   { name: "Seafoam",      a: "#a7f3d0" },
  mintice:   { name: "Mint Ice",     a: "#bbf7d0" },
  pistachio: { name: "Pistachio",    a: "#d9f99d" },
  butter:    { name: "Butter",       a: "#fde68a" },
  cream:     { name: "Cream",        a: "#fef3c7" },
  apricot:   { name: "Apricot",      a: "#fdba74" },
  peach:     { name: "Peach",        a: "#fed7aa" },
  blush:     { name: "Blush",        a: "#fbcfe8" },
  lilac:     { name: "Lilac",        a: "#e9d5ff" },
  lavender:  { name: "Lavender",     a: "#ddd6fe" },
  pearl:     { name: "Pearl",        a: "#f5f5f4" },
  cloud:     { name: "Cloud",        a: "#e2e8f0" },
  // Blues
  sky:       { name: "Sky",       a: "#7dd3fc" },
  azure:     { name: "Azure",     a: "#60a5fa" },
  blue:      { name: "Blue",      a: "#3b82f6" },
  sapphire:  { name: "Sapphire",  a: "#2563eb" },
  indigo:    { name: "Indigo",    a: "#818cf8" },
  // Cyan / teal
  cyan:      { name: "Cyan",      a: "#22d3ee" },
  teal:      { name: "Teal",      a: "#2dd4bf" },
  ocean:     { name: "Ocean",     a: "#0891b2" },
  // Greens
  mint:      { name: "Mint",      a: "#6ee7b7" },
  emerald:   { name: "Emerald",   a: "#34d399" },
  forest:    { name: "Forest",    a: "#22c55e" },
  lime:      { name: "Lime",      a: "#a3e635" },
  jade:      { name: "Jade",      a: "#10b981" },
  // Purples
  violet:    { name: "Violet",    a: "#a78bfa" },
  purple:    { name: "Purple",    a: "#c084fc" },
  plum:      { name: "Plum",      a: "#9333ea" },
  // Pinks / reds
  pink:      { name: "Pink",      a: "#f472b6" },
  rose:      { name: "Rose",      a: "#fb7185" },
  crimson:   { name: "Crimson",   a: "#ef4444" },
  ruby:      { name: "Ruby",      a: "#e11d48" },
  // Warm
  amber:     { name: "Amber",     a: "#fbbf24" },
  gold:      { name: "Gold",      a: "#eab308" },
  copper:    { name: "Copper",    a: "#d97706" },
  ember:     { name: "Ember",     a: "#f97316" },
  sand:      { name: "Sand",      a: "#d4a574" },
  // Neutrals
  stone:     { name: "Stone",     a: "#a8a29e" },
  slate:     { name: "Slate",     a: "#94a3b8" },
  steel:     { name: "Steel",     a: "#64748b" },
  silver:    { name: "Silver",    a: "#cbd5e1" },
};

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const METHODS = [
  [2, "ISNA (North America)"],
  [3, "Muslim World League"],
  [4, "Umm Al-Qura (Makkah)"],
  [5, "Egyptian Authority"],
  [8, "Gulf Region"],
  [13, "Diyanet (Turkey)"],
];

let state = { ...DEFAULTS };
let AZKAR_DATA = null; // raw json
let CATS = [];
let prayers = null;
let hijri = null;
let lastErr = null;

// ---------- storage ----------
const storage = {
  get: () =>
    new Promise((res) => {
      if (globalThis.chrome?.storage) chrome.storage.local.get(DEFAULTS, res);
      else {
        try {
          const raw = localStorage.getItem("azkar");
          res(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS });
        } catch { res({ ...DEFAULTS }); }
      }
    }),
  set: (patch) => {
    if (globalThis.chrome?.storage) chrome.storage.local.set(patch);
    else {
      try {
        const raw = localStorage.getItem("azkar");
        const cur = raw ? JSON.parse(raw) : {};
        localStorage.setItem("azkar", JSON.stringify({ ...cur, ...patch }));
      } catch {}
    }
  },
};

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const todayKey = () => new Date().toISOString().slice(0, 10);

// azkar.json has nested arrays in some entries; flatten to a single list per category.
function flattenCategory(arr) {
  const out = [];
  for (const item of arr) {
    if (Array.isArray(item)) for (const sub of item) out.push(sub);
    else out.push(item);
  }
  // Drop empty entries and known placeholder/sentinel rows (e.g. {content:"stop"}).
  return out.filter((x) => {
    if (!x || !x.content) return false;
    const c = String(x.content).trim().toLowerCase();
    if (c === "stop" || c === "—" || c === "-") return false;
    if (String(x.category).toLowerCase() === "stop") return false;
    return true;
  });
}

const MORNING_CAT = "أذكار الصباح";
const EVENING_CAT = "أذكار المساء";

// Morning: from Fajr to Maghrib. Evening: from Maghrib to Fajr.
function autoTimeCategory() {
  const nowM = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  if (prayers && prayers.Fajr && prayers.Maghrib) {
    const fajr = toMinutes(prayers.Fajr);
    const maghrib = toMinutes(prayers.Maghrib);
    return (nowM >= fajr && nowM < maghrib) ? MORNING_CAT : EVENING_CAT;
  }
  // Fallback when prayers aren't loaded yet
  const h = new Date().getHours();
  return (h >= 5 && h < 18) ? MORNING_CAT : EVENING_CAT;
}

// If autoTime is on, force category to the time-appropriate one.
// Returns true when the category changed.
function applyAutoCategory() {
  if (!state.autoTime) return false;
  const want = autoTimeCategory();
  if (state.category === want) return false;
  state.category = want;
  state.azkarIndex = 0;
  state.azkarCount = 0;
  storage.set({ category: want, azkarIndex: 0, azkarCount: 0 });
  return true;
}

function currentDhikrList() {
  if (!AZKAR_DATA) return [];
  return flattenCategory(AZKAR_DATA[state.category] || []);
}

function fmt12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const am = h < 12;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}
function toMinutes(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function nextPrayer() {
  if (!prayers) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const list = PRAYER_ORDER.map((n) => ({ name: n, m: toMinutes(prayers[n]) }));
  let nextIdx = list.findIndex((p) => p.m > nowM);
  let next, prev;
  if (nextIdx === -1) {
    next = { ...list[0], m: list[0].m + 1440 };
    prev = list[list.length - 1];
  } else {
    next = list[nextIdx];
    prev = nextIdx === 0
      ? { ...list[list.length - 1], m: list[list.length - 1].m - 1440 }
      : list[nextIdx - 1];
  }
  const d = next.m - nowM;
  const total = Math.max(1, next.m - prev.m);
  const elapsed = Math.max(0, nowM - prev.m);
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return { name: next.name, h: Math.floor(d / 60), m: d % 60, pct, prev: prev.name };
}

// ---------- data ----------
async function loadAzkar() {
  if (AZKAR_DATA) return;
  const url = globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL("azkar.json") : "azkar.json";
  const r = await fetch(url);
  AZKAR_DATA = await r.json();
  CATS = Object.keys(AZKAR_DATA);
  if (!CATS.includes(state.category)) state.category = CATS[0];
}

function ddmmyyyy() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

async function loadPrayers(force = false) {
  const today = todayKey();
  const cache = state.prayerCache;
  if (
    !force && cache &&
    cache.date === today && cache.city === state.city &&
    cache.country === state.country && cache.method === state.method
  ) {
    prayers = cache.timings;
    hijri = cache.hijri;
    return;
  }
  try {
    const url = `https://api.aladhan.com/v1/timingsByCity/${ddmmyyyy()}?city=${encodeURIComponent(state.city)}&country=${encodeURIComponent(state.country)}&method=${state.method}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!j?.data?.timings) throw new Error("Bad response");
    const t = j.data.timings;
    prayers = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    const h = j.data.date.hijri;
    hijri = `${h.day} ${h.month.en} ${h.year} AH`;
    state.prayerCache = { date: today, city: state.city, country: state.country, method: state.method, timings: prayers, hijri };
    storage.set({ prayerCache: state.prayerCache });
    lastErr = null;
  } catch (e) {
    lastErr = "Failed to load prayer times — check city/country.";
  }
}

function maybeResetDaily() {
  const today = todayKey();
  if (state.azkarResetDate !== today) {
    state.azkarResetDate = today;
    state.azkarIndex = 0;
    state.azkarCount = 0;
    storage.set({ azkarResetDate: today, azkarIndex: 0, azkarCount: 0 });
  }
}

// ---------- icons ----------
const icon = {
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  unpin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
};

const IS_PINNED = (() => {
  try { return new URLSearchParams(location.search).get("pinned") === "1"; }
  catch { return false; }
})();

// ---------- views ----------
function headerHTML() {
  const pinned = globalThis.electronAPI ? true : IS_PINNED;
  return `
    <div class="brand"><img class="logo" src="icon.png" alt="Zakkir"/><span class="name">Zakkir</span></div>
    <div class="icons">
      ${globalThis.electronAPI ? "" : `<button class="icon-btn" id="pinBtn" title="${pinned ? "Close pinned window" : "Pin (keep open)"}">${pinned ? icon.unpin : icon.pin}</button>`}
      ${globalThis.electronAPI ? `<button class="icon-btn" id="closeBtn" title="Close">${icon.close}</button>` : ""}
      <button class="icon-btn" data-go="settings" title="Settings">${icon.gear}</button>
    </div>`;
}

function prayerCardHTML() {
  const np = nextPrayer();
  return `
    <div class="next-line">
      <span class="next-text">${np ? `Next <b>${np.name}</b> in <b>${np.h}h ${np.m}m</b>` : (lastErr ? "—" : "Loading…")}</span>
      <span class="hijri">${hijri || ""}</span>
    </div>
    ${np ? `<div class="prayer-progress" title="${np.prev} → ${np.name}"><div style="width:${np.pct}%"></div></div>` : ""}
    <div class="prayer-grid">
      ${PRAYER_ORDER.map((name) => {
        const active = np && np.name === name;
        const t = prayers ? fmt12(prayers[name]) : "—";
        return `<div class="prayer ${active ? "active" : ""}"><div class="n">${name}</div><div class="t">${t}</div></div>`;
      }).join("")}
    </div>
    ${lastErr ? `<div class="err">${lastErr}</div>` : ""}`;
}

function catRowHTML() {
  const list = currentDhikrList();
  const z = list[state.azkarIndex] || { count: "1" };
  const target = parseInt(z.count, 10) || 1;
  return `
    <select class="cat-pick" id="catPick">
      ${CATS.map((c) => `<option value="${c}" ${c === state.category ? "selected" : ""}>${c}</option>`).join("")}
    </select>
    <span class="counter">${state.azkarCount} / ${target}</span>`;
}

function azkarCardHTML() {
  const list = currentDhikrList();
  const z = list[state.azkarIndex] || { content: "—", count: "1", description: "" };
  const target = parseInt(z.count, 10) || 1;
  const pct = Math.min(100, (state.azkarCount / target) * 100);
  return `
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="dhikr">${z.content}</div>
    ${z.description ? `<div class="desc">${z.description}</div>` : ""}
    <div class="tap-hint">Tap to count</div>`;
}

function navIndicatorText() {
  const list = currentDhikrList();
  return `${state.azkarIndex + 1} / ${list.length || 0}`;
}

function renderHome() {
  return `
    <div class="app">
      <div class="header" id="headerRegion">${headerHTML()}</div>
      <div class="card" id="prayerRegion">${prayerCardHTML()}</div>
      <div class="cat-row" id="catRegion">${catRowHTML()}</div>
      <div class="azkar-card" id="azkarTap">${azkarCardHTML()}</div>
      <div class="nav-row">
        <button class="nav-btn" data-nav="-1">${icon.prev}</button>
        <button class="nav-btn" id="resetBtn">${icon.reset}</button>
        <button class="nav-btn" data-nav="1">${icon.next}</button>
      </div>
      <div class="tap-hint" id="navIndicator">${navIndicatorText()}</div>
    </div>
  `;
}


function renderSettings() {
  return `
    <div class="app">
      <div class="settings-head">
        <button class="icon-btn" data-go="home">${icon.back}</button>
        <h1>Settings</h1>
        <span style="width:30px"></span>
      </div>

      <div class="sec">Location</div>
      <div class="row">
        <label>City</label>
        <input class="input" id="city" value="${state.city}" />
      </div>
      <div class="row">
        <label>Country</label>
        <input class="input" id="country" value="${state.country}" />
      </div>
      <div class="row">
        <label>Calc method</label>
        <select id="method">
          ${METHODS.map(([v, n]) => `<option value="${v}" ${v === state.method ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </div>

      <div class="sec">Arabic Font</div>
      <div class="font-grid">
        ${Object.keys(FONT_MAP).map((f) => `<button class="pill ${state.font === f ? "active" : ""}" data-font="${f}" style="font-family:${FONT_MAP[f]}">${f}</button>`).join("")}
      </div>
      <div class="row">
        <label>Arabic size</label>
        <input type="range" min="0.7" max="2" step="0.05" value="${state.arSize}" id="arSize"/>
        <span>${state.arSize.toFixed(2)}×</span>
      </div>
      <div class="preview">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>

      <div class="sec">Theme</div>
      <div class="theme-grid">
        ${THEMES.map(([id, label]) => `
          <button class="theme-card ${state.theme === id ? "active" : ""}" data-theme="${id}">
            <div class="sw" data-theme-sw="${id}"></div>${label}
          </button>`).join("")}
      </div>

      <div class="sec">Accent Color</div>
      <div class="palette-grid">
        ${Object.entries(PALETTES).map(([id, p]) => `
          <button class="palette-chip ${state.palette === id ? "active" : ""}" data-palette="${id}" title="${p.name}"
            style="background:${p.a || "transparent"};${!p.a ? "background:repeating-linear-gradient(45deg,var(--surface-2) 0 4px,var(--line) 4px 8px);" : ""}"></button>`).join("")}
      </div>

      <div class="sec">Size & Zoom</div>
      <div class="row">
        <label>UI zoom</label>
        <div class="zoom-row">
          <button class="zoom-btn" data-zoom="-0.1">−</button>
          <span class="zoom-val">${Math.round(state.zoom * 100)}%</span>
          <button class="zoom-btn" data-zoom="0.1">+</button>
        </div>
      </div>
      ${globalThis.electronAPI ? "" : `
      <div class="row">
        <label>Width</label>
        <input type="range" min="320" max="780" step="10" value="${state.popupW}" id="popupW"/>
        <span>${state.popupW}px</span>
      </div>
      <div class="row">
        <label>Height</label>
        <input type="range" min="420" max="600" step="10" value="${state.popupH}" id="popupH"/>
        <span>${state.popupH}px</span>
      </div>
      <div class="desc" style="direction:ltr;text-align:left">Tip: Chrome popups cap around 800×600. For a fully resizable window, open in a tab from the home screen.</div>
      `}
    </div>
  `;
}

// ---------- render & wire ----------
function contrastInk(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0b0f1a" : "#ffffff";
}

function applyVars() {
  const validThemes = THEMES.map(([id]) => id);
  for (const id of validThemes) document.documentElement.classList.remove("theme-" + id);
  const theme = validThemes.includes(state.theme) ? state.theme : "dark";
  document.documentElement.classList.add("theme-" + theme);
  const font = FONT_MAP[state.font] ? state.font : "Noto Naskh Arabic";
  document.body.style.setProperty("--ar-font", FONT_MAP[font]);
  document.body.style.setProperty("--ar-size", state.arSize);
  document.body.style.setProperty("--zoom", state.zoom);
  document.body.style.setProperty("--popup-w", state.popupW + "px");
  document.body.style.setProperty("--popup-h", state.popupH + "px");

  const pinned = globalThis.electronAPI ? true : IS_PINNED;
  document.body.classList.toggle("pinned", pinned);

  // Palette: single accent color, no gradient
  document.body.style.removeProperty("--accent");
  document.body.style.removeProperty("--accent-ink");
  const p = PALETTES[state.palette];
  if (p && p.a) {
    document.body.style.setProperty("--accent", p.a);
    document.body.style.setProperty("--accent-ink", contrastInk(p.a));
  }
}


function setHTML(el, html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  el.textContent = "";
  while (doc.body.firstChild) el.appendChild(doc.body.firstChild);
}

function render() {
  applyVars();
  const app = $("#app");
  setHTML(app, state.view === "settings" ? renderSettings() : renderHome());
  wire();
}

function patchCount(count, target) {
  const counter = document.querySelector("#catRegion .counter");
  if (counter) counter.textContent = `${count} / ${target}`;
  const bar = document.querySelector("#azkarTap .progress > div");
  if (bar) bar.style.width = `${Math.min(100, (count / target) * 100)}%`;
}

function patchAzkarCard() {
  const el = $("#azkarTap"); if (el) setHTML(el, azkarCardHTML());
  const cat = $("#catRegion");
  if (cat) {
    const list = currentDhikrList();
    const z = list[state.azkarIndex] || { count: "1" };
    const target = parseInt(z.count, 10) || 1;
    const counter = cat.querySelector(".counter");
    if (counter) counter.textContent = `${state.azkarCount} / ${target}`;
  }
  const nav = $("#navIndicator");
  if (nav) nav.textContent = navIndicatorText();
}

function patchPrayerCard() {
  const el = $("#prayerRegion"); if (el) setHTML(el, prayerCardHTML());
}

// Settings in-place helpers
function patchSettingsActive(attr, value) {
  document.querySelectorAll(`[${attr}]`).forEach((b) => {
    b.classList.toggle("active", b.getAttribute(attr) === String(value));
  });
}
function patchSliderLabel(inputId, text) {
  const inp = $("#" + inputId);
  const span = inp && inp.parentElement && inp.parentElement.querySelector("span");
  if (span) span.textContent = text;
}
function patchZoomLabel() {
  const v = document.querySelector(".zoom-val");
  if (v) v.textContent = Math.round(state.zoom * 100) + "%";
}

const VAR_ONLY_KEYS = new Set(["font", "arSize", "theme", "palette", "zoom", "popupW", "popupH"]);
const AZKAR_ONLY_KEYS = new Set(["azkarIndex", "azkarCount", "category"]);

function update(patch, persist = true) {
  state = { ...state, ...patch };
  if (persist) {
    const save = {};
    for (const k of Object.keys(patch)) save[k] = state[k];
    storage.set(save);
  }
  const keys = Object.keys(patch);
  // CSS-vars-only changes never need a DOM rerender, in either view.
  if (keys.length && keys.every((k) => VAR_ONLY_KEYS.has(k))) { applyVars(); return; }
  if (state.view === "settings") { render(); return; }
  if (keys.length && keys.every((k) => AZKAR_ONLY_KEYS.has(k))) { patchAzkarCard(); return; }
  render();
}

function wire() {
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => update({ view: b.dataset.go }))
  );

  // Home interactions
  const tap = $("#azkarTap");
  if (tap) tap.addEventListener("click", () => {
    const list = currentDhikrList();
    const z = list[state.azkarIndex]; if (!z) return;
    const target = parseInt(z.count, 10) || 1;
    const next = state.azkarCount + 1;
    tap.classList.add("pulse");
    setTimeout(() => tap.classList.remove("pulse"), 220);
    if (next >= target) {
      // finish: patch in place, then advance with a full render
      patchCount(target, target);
      setTimeout(() => {
        const ni = (state.azkarIndex + 1) % list.length;
        update({ azkarIndex: ni, azkarCount: 0 });
      }, 280);
    } else {
      // in-place patch: no full re-render, no flicker
      state.azkarCount = next;
      storage.set({ azkarCount: next });
      patchCount(next, target);
    }
  });
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      const list = currentDhikrList(); if (!list.length) return;
      const dir = parseInt(b.dataset.nav, 10);
      const i = (state.azkarIndex + dir + list.length) % list.length;
      update({ azkarIndex: i, azkarCount: 0 });
    })
  );
  const reset = $("#resetBtn");
  if (reset) reset.addEventListener("click", () => {
    const list = currentDhikrList();
    const z = list[state.azkarIndex];
    const target = z ? (parseInt(z.count, 10) || 1) : 1;
    state.azkarCount = 0;
    storage.set({ azkarCount: 0 });
    patchCount(0, target);
  });
  const cat = $("#catPick");
  if (cat) cat.addEventListener("change", (e) => {
    // manual pick disables auto morning/evening swap
    state.autoTime = false;
    storage.set({ autoTime: false });
    update({ category: e.target.value, azkarIndex: 0, azkarCount: 0 });
  });
  // openTab removed — no longer used
  const pinBtn = $("#pinBtn");
  if (pinBtn) pinBtn.addEventListener("click", () => {
    if (IS_PINNED) { window.close(); return; }
    const base = globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL("popup.html") : "popup.html";
    const url = base + "?pinned=1";
    const w = Math.round(state.popupW + 16);
    const h = Math.round(state.popupH + 40);
    if (globalThis.chrome?.windows?.create) {
      chrome.windows.create({ url, type: "popup", width: w, height: h, focused: true }, () => window.close());
    } else {
      window.open(url, "zakkir-pinned", `popup=yes,width=${w},height=${h}`);
    }
  });

  const closeBtn = $("#closeBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (globalThis.electronAPI) {
      globalThis.electronAPI.closeWindow();
    }
  });

  // Settings interactions
  const city = $("#city");
  if (city) city.addEventListener("change", async (e) => {
    state.city = e.target.value.trim() || "Cairo";
    storage.set({ city: state.city });
    await loadPrayers(true); render();
  });
  const country = $("#country");
  if (country) country.addEventListener("change", async (e) => {
    state.country = e.target.value.trim() || "Egypt";
    storage.set({ country: state.country });
    await loadPrayers(true); render();
  });
  const method = $("#method");
  if (method) method.addEventListener("change", async (e) => {
    state.method = parseInt(e.target.value, 10);
    storage.set({ method: state.method });
    await loadPrayers(true); render();
  });
  document.querySelectorAll("[data-font]").forEach((b) =>
    b.addEventListener("click", () => {
      update({ font: b.dataset.font });
      patchSettingsActive("data-font", b.dataset.font);
    })
  );
  document.querySelectorAll("[data-theme]").forEach((b) =>
    b.addEventListener("click", () => {
      update({ theme: b.dataset.theme });
      patchSettingsActive("data-theme", b.dataset.theme);
    })
  );
  document.querySelectorAll("[data-palette]").forEach((b) =>
    b.addEventListener("click", () => {
      update({ palette: b.dataset.palette });
      patchSettingsActive("data-palette", b.dataset.palette);
    })
  );
  // paint theme swatches with each theme's accent/bg preview
  const THEME_SW = {
    light:      { bg: "#ffffff", a: "#2563eb" },
    paper:      { bg: "#f7f5ef", a: "#374151" },
    sepia:      { bg: "#fbf5e3", a: "#6b4f2a" },
    "solar-l":  { bg: "#fdf6e3", a: "#268bd2" },
    "gruv-l":   { bg: "#fbf1c7", a: "#af3a03" },
    "rosepine-d": { bg: "#faf4ed", a: "#b4637a" },
    "mint-l":   { bg: "#f1faf5", a: "#0f766e" },
    latte:      { bg: "#eff1f5", a: "#8839ef" },
    dark:       { bg: "#161922", a: "#60a5fa" },
    midnight:   { bg: "#11162a", a: "#7dd3fc" },
    slate:      { bg: "#1a2029", a: "#94a3b8" },
    coffee:     { bg: "#221a14", a: "#d4a574" },
    nord:       { bg: "#2e3440", a: "#88c0d0" },
    dracula:    { bg: "#282a36", a: "#bd93f9" },
    "gruv-d":   { bg: "#282828", a: "#fabd2f" },
    "solar-d":  { bg: "#002b36", a: "#268bd2" },
    rosepine:   { bg: "#191724", a: "#ebbcba" },
    mocha:      { bg: "#1e1e2e", a: "#cba6f7" },
    tokyo:      { bg: "#1a1b26", a: "#7aa2f7" },
    forest:     { bg: "#0f1a14", a: "#7cb992" },
    ocean:      { bg: "#0a1929", a: "#5eead4" },
    mono:       { bg: "#f5f5f5", a: "#111111" },
    terminal:   { bg: "#0a0e0a", a: "#22c55e" },
    linen:      { bg: "#fbfaf6", a: "#475569" },
    fog:        { bg: "#f8fafc", a: "#475569" },
    "sky-l":    { bg: "#f0f9ff", a: "#0ea5e9" },
    "sage-l":   { bg: "#f1f7f2", a: "#15803d" },
    "rose-l":   { bg: "#fff1f2", a: "#e11d48" },
    "lavender-l":{ bg: "#f5f3ff", a: "#7c3aed" },
    "peach-l":  { bg: "#fff7ed", a: "#ea580c" },
    "lemon-l":  { bg: "#fefce8", a: "#ca8a04" },
    obsidian:   { bg: "#050507", a: "#f59e0b" },
    carbon:     { bg: "#1a1a1a", a: "#ef4444" },
    cyberpunk:  { bg: "#0a0014", a: "#ec4899" },
    matrix:     { bg: "#000a00", a: "#22ff66" },
    wine:       { bg: "#1a0e14", a: "#f9a8d4" },
  };
  document.querySelectorAll("[data-theme-sw]").forEach((el) => {
    const t = THEME_SW[el.dataset.themeSw];
    if (t) {
      el.style.cssText = `background:${t.bg};border:1px solid var(--line);position:relative;`;
      el.textContent = "";
      const dot = document.createElement("span");
      dot.style.cssText = `position:absolute;right:4px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:${t.a}`;
      el.appendChild(dot);
    }
  });
  const arSize = $("#arSize");
  if (arSize) arSize.addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    update({ arSize: v });
    patchSliderLabel("arSize", v.toFixed(2) + "×");
  });
  document.querySelectorAll("[data-zoom]").forEach((b) =>
    b.addEventListener("click", () => {
      const z = Math.max(0.6, Math.min(2, +(state.zoom + parseFloat(b.dataset.zoom)).toFixed(2)));
      update({ zoom: z });
      patchZoomLabel();
    })
  );
  const w = $("#popupW");
  if (w) w.addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    update({ popupW: v });
    patchSliderLabel("popupW", v + "px");
  });
  const h = $("#popupH");
  if (h) h.addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    update({ popupH: v });
    patchSliderLabel("popupH", v + "px");
  });
}

// ---------- init ----------
(async function init() {
  const data = await storage.get();
  state = { ...DEFAULTS, ...data };

  if (globalThis.electronAPI) {
    document.body.classList.add("electron");
    globalThis.electronAPI.resizeWindow(state.popupW, state.popupH);
    globalThis.electronAPI.setAlwaysOnTop(true);
    
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        update({ popupW: window.innerWidth, popupH: window.innerHeight });
      }, 500);
    });
  }

  try { await loadAzkar(); } catch (e) { lastErr = "Failed to load azkar data."; }
  maybeResetDaily();
  applyAutoCategory();
  render();
  await loadPrayers();
  // Re-evaluate auto category now that real prayer times are loaded.
  const switched = applyAutoCategory();
  if (state.view === "settings") render();
  else { patchPrayerCard(); if (switched) patchAzkarCard(); }

  // Smooth countdown + auto morning/evening swap, in-place only.
  setInterval(() => {
    if (state.view !== "home") return;
    patchPrayerCard();
    if (applyAutoCategory()) patchAzkarCard();
  }, 30_000);
})();
