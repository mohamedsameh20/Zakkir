// Azkar Extension — Prayer Times + Azkar (Hisn al-Muslim)
// Prayer times: api.aladhan.com (timings)
// Azkar:        bundled azkar.json (Hisn al-Muslim, nawafalqari/azkar-api)

const DEFAULTS = {
  view: "home",
  font: "Scheherazade",
  arSize: 0.9,
  zoom: 1.0,
  popupW: 763,
  popupH: 800,
  theme: "frutiger",
  palette: "default",
  neobrutalContrast: "quiet",
  settingsSection: "general",
  lat: 30.0444,
  lng: 31.2357,
  locationName: "Cairo, Egypt",
  locationMethod: "manual",
  locationTab: "city",
  locationAdvancedOpen: false,
  method: 5,
  category: "أذكار الصباح",
  autoTime: true,
  azkarIndex: 0,
  azkarCount: 0,
  azkarResetDate: null,
  prayerCache: null,
  isElectronPinned: false,
  notificationsEnabled: true,
  remindersEnabled: false,
  reminderMinutes: 10,
  reminderPrayers: ["Fajr","Dhuhr","Asr","Maghrib","Isha"],
  reminderSound: "adhan-makkah",
  prayerAlertEnabled: true,
  iqamaEnabled: false,
  iqamaMinutes: 10,
  ignoreUpdateUntil: 0,
  scheduleMonth: null,
  scheduleDateMode: "g",
  scheduleCache: {},
  sunnahFastHighlight: true,
  updateAlertsEnabled: true,
};

// Transient (not persisted)
let focusedPrayer = null;
let countSaveTimer = null;

function persistAzkarCount(count) {
  clearTimeout(countSaveTimer);
  countSaveTimer = setTimeout(() => {
    storage.set({ azkarCount: count });
    countSaveTimer = null;
  }, 180);
}

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
  // Design eras
  ["metro",      "Metro Flat"],
  ["material",   "Material Elevation"],
  ["neumorphic", "Neumorphic Contrast"],
  // Glass and depth
  ["aqua",       "Aqua"],
  ["liquidglass","Liquid Glass"],
  ["frutiger",   "Frutiger Aero"],
  // Bold and anti-design
  ["neobrutal",  "Neobrutalist"],
  ["webbrutal",  "Web Brutalist"],
  // Dark counterparts
  ["metro-dark",       "Metro Flat Dark"],
  ["material-dark",    "Material Dark"],
  ["neumorphic-dark",  "Neumorphic Dark"],
  ["aqua-dark",        "Aqua Night"],
  ["liquidglass-dark", "Liquid Glass Dark"],
  ["frutiger-dark",    "Frutiger Twilight"],
  ["editorial-dark",   "Editorial Night"],
  ["softclay-dark",    "Dark Clay"],
  ["webbrutal-dark",   "Web Brutalist Dark"],
  // Structural systems
  ["editorial", "Editorial Ink"],
  ["blueprint", "Blueprint"],
  ["softclay",  "Soft Clay"],
  ["control",   "Control Room"],
  // Special
  ["glass",     "Aurora Glass"],
  ["noor",      "Noor"],
  ["celestial", "Celestial"],
  ["sahara",    "Sahara"],
  ["andalus",   "Andalus Garden"],
  ["motherpearl","Mother of Pearl"],
  ["minaret",   "Minaret Blue"],
  ["olive",     "Olive Grove"],
  ["ramadan",   "Ramadan Lantern"],
  ["zen",       "Quiet Stone"],
  ["nightdune", "Night Dunes"],
  ["wadi",      "Wadi Water"],
  ["patina",    "Copper Patina"],
  ["calligraphy","Calligraphy Studio"],
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

const THEME_BASES = {
  "metro-dark": "metro",
  "material-dark": "material",
  "neumorphic-dark": "neumorphic",
  "aqua-dark": "aqua",
  "liquidglass-dark": "liquidglass",
  "frutiger-dark": "frutiger",
  "editorial-dark": "editorial",
  "softclay-dark": "softclay",
  "webbrutal-dark": "webbrutal",
};

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
const PRESETS = {
  "Egypt (مصر)": {
    "Cairo (القاهرة)": [30.0444, 31.2357],
    "Alexandria (الإسكندرية)": [31.2001, 29.9187],
    "Giza (الجيزة)": [30.0131, 31.2089],
    "Mansoura (المنصورة)": [31.0409, 31.3785],
    "Tanta (طنطا)": [30.7865, 31.0004],
    "Asyut (أسيوط)": [27.1810, 31.1837]
  },
  "Saudi Arabia (المملكة العربية السعودية)": {
    "Makkah (مكة المكرمة)": [21.3891, 39.8579],
    "Madinah (المدينة المنورة)": [24.4672, 39.6111],
    "Riyadh (الرياض)": [24.7136, 46.6753],
    "Jeddah (جدة)": [21.5433, 39.1728],
    "Dammam (الدمام)": [26.4207, 50.0888]
  },
  "Palestine (فلسطين)": {
    "Al-Quds (القدس)": [31.7683, 35.2137],
    "Gaza (غزة)": [31.5000, 34.4667],
    "Hebron (الخليل)": [31.5292, 35.0938],
    "Nablus (نابلس)": [32.2211, 35.2544],
    "Ramallah (رام الله)": [31.9029, 35.2033]
  },
  "UAE (الإمارات العربية المتحدة)": {
    "Dubai (دبي)": [25.2048, 55.2708],
    "Abu Dhabi (أبوظبي)": [24.4539, 54.3773],
    "Sharjah (الشارقة)": [25.3463, 55.4209]
  },
  "Jordan (الأردن)": {
    "Amman (عمان)": [31.9454, 35.9284],
    "Zarqa (الزرقاء)": [32.0608, 36.0879],
    "Irbid (إربد)": [32.5514, 35.8514]
  },
  "Turkey (تركيا)": {
    "Istanbul (إسطنبول)": [41.0082, 28.9784],
    "Ankara (أنقرة)": [39.9334, 32.8597],
    "Izmir (إزمير)": [38.4192, 27.1287]
  },
  "Morocco (المغرب)": {
    "Casablanca (الدار البيضاء)": [33.5731, -7.5898],
    "Rabat (الرباط)": [34.0209, -6.8416],
    "Marrakech (مراكش)": [31.6295, -7.9811]
  },
  "Malaysia (ماليزيا)": {
    "Kuala Lumpur (كوالالمبور)": [3.1390, 101.6869],
    "Penang (بينانق)": [5.4141, 100.3288]
  },
  "United Kingdom (المملكة المتحدة)": {
    "London": [51.5074, -0.1278],
    "Birmingham": [52.4862, -1.8904],
    "Manchester": [53.4808, -2.2426]
  },
  "USA (الولايات المتحدة)": {
    "New York": [40.7128, -74.0060],
    "Los Angeles": [34.0522, -118.2437],
    "Chicago": [41.8781, -87.6298]
  },
  "Qatar (قطر)": {
    "Doha (الدوحة)": [25.2854, 51.5310]
  },
  "Kuwait (الكويت)": {
    "Kuwait City (مدينة الكويت)": [29.3759, 47.9774]
  }
};

let state = { ...DEFAULTS };
let AZKAR_DATA = null; // raw json
let CATS = [];
let prayers = null;
let hijri = null;
let lastErr = null;
let activePrayer = null; // UI-only, not persisted
let activeAudio = null;

// ---------- storage ----------
const storage = {
  get: () =>
    new Promise((res) => {
      if (globalThis.chrome?.storage) chrome.storage.local.get(DEFAULTS, res);
      else if (globalThis.electronAPI?.loadSettings) {
        globalThis.electronAPI.loadSettings().then(raw => {
          res(raw ? { ...DEFAULTS, ...raw } : { ...DEFAULTS });
        }).catch(() => res({ ...DEFAULTS }));
      }
      else {
        try {
          const raw = localStorage.getItem("azkar");
          res(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS });
        } catch { res({ ...DEFAULTS }); }
      }
    }),
  set: (patch) => {
    if (globalThis.chrome?.storage) {
      chrome.storage.local.set(patch);
    } else if (globalThis.electronAPI?.saveSettings) {
      globalThis.electronAPI.saveSettings(patch);
    } else {
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

// ---------- geocoding ----------
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
    const j = await r.json();
    const a = j.address || {};
    return [a.city || a.town || a.village || a.county || "", a.country || ""].filter(Boolean).join(", ") || j.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
}

async function forwardGeocode(query) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, { headers: { 'Accept-Language': 'en' } });
    return await r.json();
  } catch { return []; }
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
  const latR = +state.lat.toFixed(4);
  const lngR = +state.lng.toFixed(4);
  if (
    !force && cache &&
    cache.date === today &&
    +cache.lat === latR && +cache.lng === lngR &&
    cache.method === state.method
  ) {
    prayers = cache.timings;
    hijri = cache.hijri;
    return;
  }
  try {
    const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy()}?latitude=${latR}&longitude=${lngR}&method=${state.method}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!j?.data?.timings) throw new Error("Bad response");
    const t = j.data.timings;
    prayers = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    const h = j.data.date.hijri;
    hijri = `${h.day} ${h.month.en} ${h.year} AH`;
    state.prayerCache = { date: today, lat: latR, lng: lngR, method: state.method, timings: prayers, hijri };
    storage.set({ prayerCache: state.prayerCache });
    lastErr = null;
    // send to main process for reminder scheduling
    syncReminders();
    applyAutoAzkarCategory();
  } catch (e) {
    lastErr = "Failed to load prayer times — check your location.";
  }
}

function syncReminders() {
  if (globalThis.electronAPI?.setPrayerTimes && prayers) {
    globalThis.electronAPI.setPrayerTimes(prayers, {
      notificationsEnabled: state.notificationsEnabled,
      remindersEnabled: state.remindersEnabled,
      reminderMinutes: state.reminderMinutes,
      reminderPrayers: state.reminderPrayers,
      reminderSound: state.reminderSound,
      prayerAlertEnabled: state.prayerAlertEnabled,
      iqamaEnabled: state.iqamaEnabled,
      iqamaMinutes: state.iqamaMinutes,
    });
  }
}

function applyAutoAzkarCategory() {
  if (!state.autoTime || !prayers) return;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const fajrM = toMinutes(prayers.Fajr);
  const maghribM = toMinutes(prayers.Maghrib);
  const isMorning = nowM >= fajrM && nowM < maghribM;
  const targetCat = isMorning ? "أذكار الصباح" : "أذكار المساء";
  if (state.category !== targetCat) {
    state.category = targetCat;
    state.azkarIndex = 0;
    state.azkarCount = 0;
    storage.set({ category: targetCat, azkarIndex: 0, azkarCount: 0 });
    if (state.view === "home") {
      patchAzkarCard();
    }
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
  applyAutoAzkarCategory();
}

// ---------- icons ----------
const icon = {
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  unpin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  minimize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`,
};

const IS_PINNED = (() => {
  try { return new URLSearchParams(location.search).get("pinned") === "1"; }
  catch { return false; }
})();

// ---------- views ----------
function headerHTML() {
  const pinned = globalThis.electronAPI ? true : IS_PINNED;
  return `
    <div class="brand"><img class="logo" src="icon.png" alt="Zakkir"/><span><span class="name">Zakkir</span><span class="brand-sub">Daily remembrance</span></span></div>
    <div class="icons">
      ${globalThis.electronAPI ? "" : `<button class="icon-btn" id="pinBtn" title="${pinned ? "Close pinned window" : "Pin (keep open)"}">${pinned ? icon.unpin : icon.pin}</button>`}
      ${globalThis.electronAPI ? `<button class="icon-btn" id="minimizeBtn" title="Minimize">${icon.minimize}</button>` : ""}
      ${globalThis.electronAPI ? `<button class="icon-btn" id="closeBtn" title="Close">${icon.close}</button>` : ""}
      <button class="icon-btn" data-go="schedule" title="Monthly schedule">${icon.cal}</button>
      <button class="icon-btn" data-go="settings" title="Settings">${icon.gear}</button>
    </div>`;
}

function prayerCardHTML() {
  const np = nextPrayer();
  return `
    <div class="prayer-hero">
      <div class="next-line">
        <span class="eyebrow">Next prayer</span>
        <span class="hijri">${hijri || ""}</span>
      </div>
      <div class="next-prayer">
        <div class="next-name">${np ? np.name : (lastErr ? "Unavailable" : "Loading…")}</div>
        ${np ? `<div class="next-countdown"><strong>${np.h}<small>h</small></strong><span>:</span><strong>${String(np.m).padStart(2, "0")}<small>m</small></strong></div>` : ""}
      </div>
    </div>
    ${np ? `<div class="prayer-progress" title="${np.prev} → ${np.name}"><div style="width:${np.pct}%"></div></div>` : ""}
    <div class="prayer-grid">
      ${PRAYER_ORDER.map((name) => {
        const isCurrent = np && np.name === name;
        const isTap = activePrayer === name;
        const t = prayers ? fmt12(prayers[name]) : "—";
        const cls = ["prayer"];
        if (isCurrent) cls.push("current");
        if (isTap) cls.push("tapped");
        return `<button type="button" class="${cls.join(" ")}" data-prayer="${name}"><div class="n">${name}</div><div class="t">${t}</div></button>`;
      }).join("")}
    </div>
    <div class="prayer-detail" id="prayerDetail">${activePrayer ? detailHTML(activePrayer) : ""}</div>
    ${lastErr ? `<div class="err">${lastErr}</div>` : ""}`;
}

function detailHTML(name) {
  if (!prayers || !prayers[name]) return "";
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const prayerM = toMinutes(prayers[name]);
  const diff = prayerM - nowM;
  const isPast = diff <= 0;
  const absDiff = Math.abs(diff);
  const hrs = Math.floor(absDiff / 60);
  const mins = absDiff % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const nextIdx = (PRAYER_ORDER.indexOf(name) + 1) % PRAYER_ORDER.length;
  const nextName = PRAYER_ORDER[nextIdx];
  const nextTime = prayers[nextName] ? fmt12(prayers[nextName]) : "";
  return `
    <div class="detail-inner">
      <span class="detail-name">${name}</span>
      <span class="detail-time">${isPast ? `${timeStr} ago` : `in ${timeStr}`}</span>
      ${nextTime ? `<span class="detail-next">→ ${nextName} at ${nextTime}</span>` : ""}
    </div>`;
}

function catRowHTML() {
  const list = currentDhikrList();
  const z = list[state.azkarIndex] || { count: "1" };
  const target = parseInt(z.count, 10) || 1;
  return `
    <span class="section-label">Today's azkar</span>
    <div class="cat-tools">${dropdownHTML("catPick", state.category, CATS.map((c) => ({ v: c, l: c })), { full: true })}
    <span class="counter">${state.azkarCount} / ${target}</span></div>`;
}

function splitOpeningFormula(content) {
  const lines = String(content || "").split("\n");
  if (lines.length < 2) return { preamble: "", body: String(content || "") };
  const first = lines[0].trim();
  const kind = /أَعُوذُ\s+بِالله|أَعُوذُ\s+بِاللَّه/.test(first)
    ? "istiadhah"
    : /بِسْمِ\s+الله|بِسْمِ\s+اللَّه/.test(first)
      ? "basmala" : "";
  return kind
    ? { preamble: first, preambleKind: kind, body: lines.slice(1).join("\n").trim() }
    : { preamble: "", body: String(content || "") };
}

function azkarCardHTML() {
  const list = currentDhikrList();
  const z = list[state.azkarIndex] || { content: "—", count: "1", description: "" };
  const target = parseInt(z.count, 10) || 1;
  const pct = Math.min(100, (state.azkarCount / target) * 100);
  const reading = splitOpeningFormula(z.content);
  return `
    <div class="progress"><div style="width:${pct}%"></div></div>
    ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
    <div class="dhikr" lang="ar">${reading.body}</div>
    ${z.description ? `<div class="desc">${z.description}</div>` : ""}
    <div class="tap-hint">Tap anywhere to count</div>`;
}

function navIndicatorText() {
  const list = currentDhikrList();
  return `${state.azkarIndex + 1} / ${list.length || 0}`;
}

function renderHome() {
  return `
    <div class="app home-view">
      <div class="header" id="headerRegion">${headerHTML()}</div>
      <section class="card prayer-card" id="prayerRegion" aria-label="Prayer times">${prayerCardHTML()}</section>
      <div class="cat-row" id="catRegion">${catRowHTML()}</div>
      <button type="button" class="azkar-card" id="azkarTap" aria-label="Count this dhikr">${azkarCardHTML()}</button>
      <div class="nav-row">
        <button class="nav-btn" data-nav="-1" title="Previous dhikr">${icon.prev}<span>Previous</span></button>
        <button class="nav-btn reset-btn" id="resetBtn" title="Reset count">${icon.reset}<span>Reset</span></button>
        <button class="nav-btn" data-nav="1" title="Next dhikr"><span>Next</span>${icon.next}</button>
      </div>
      <div class="nav-indicator" id="navIndicator">${navIndicatorText()}</div>
    </div>
  `;
}

function renderMap() {
  return `
    <div class="map-view">
      <div class="map-toolbar">
        <button class="icon-btn" id="mapBackBtn">${icon.back}</button>
        <div class="map-search-wrap">
          <input class="map-search" id="mapSearch" placeholder="Search city…" autocomplete="off"/>
          <div class="map-results" id="mapResults"></div>
        </div>
      </div>
      <div id="leafletMap"></div>
      <div class="map-footer">
        <div class="map-loc-label" id="mapLocLabel">${state.locationName}</div>
        <button class="btn-primary" id="useLocationBtn">✓ Use This Location</button>
      </div>
    </div>`;
}

// ---------- Monthly schedule ----------
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Aladhan calendar endpoint returns times like "04:23 (EET)" — strip suffix.
function cleanTime(s) {
  if (!s) return "00:00";
  const m = String(s).match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : s;
}


function currentScheduleYM() {
  if (state.scheduleMonth && /^\d{4}-\d{2}$/.test(state.scheduleMonth)) return state.scheduleMonth;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function stepScheduleMonth(delta) {
  const [y, m] = currentScheduleYM().split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function scheduleCacheKey(state, ym) {
  return `v4|coords|${state.lat}|${state.lng}|${state.method}|${ym}`;
}

// Notable Hijri days — keyed as "hMonthNumber|hDayNumber"
const HIJRI_EVENTS = {
  "1|1": "Islamic New Year",
  "1|10": "Day of Ashura",
  "3|12": "Mawlid an-Nabi",
  "7|27": "Isra & Mi'raj",
  "8|15": "Mid-Sha'ban",
  "9|1": "1st of Ramadan",
  "9|27": "Laylat al-Qadr (likely)",
  "10|1": "Eid al-Fitr",
  "12|9": "Day of Arafah",
  "12|10": "Eid al-Adha",
};
function hijriEventName(hMonthNum, hDay) {
  return HIJRI_EVENTS[`${Number(hMonthNum)}|${Number(hDay)}`] || "";
}

let _scheduleData = null;     // { ym, key, days: [{g, h, timings}], loading, error }
let _scheduleLoadingKey = null;

async function fetchMonth(ym) {
  const key = scheduleCacheKey(state, ym);
  const cached = state.scheduleCache?.[key];
  const fresh = cached && (Date.now() - (cached.fetchedAt || 0) < 24 * 3600 * 1000);
  if (cached) {
    _scheduleData = { ym, key, days: cached.days, error: null, loading: !fresh };
  } else {
    _scheduleData = { ym, key, days: null, error: null, loading: true };
  }
  // Always reflect the new _scheduleData in the DOM on the next tick, so
  // a cache hit (fresh or stale) doesn't leave a stale "Loading…" body
  // when fetchMonth is called after the initial render.
  if (state.view === "schedule") {
    Promise.resolve().then(() => { if (state.view === "schedule") patchSchedule(); });
  }
  if (fresh) return;
  if (_scheduleLoadingKey === key) return;
  _scheduleLoadingKey = key;
  try {
    const [y, m] = ym.split("-").map(Number);
    const url = `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${state.lat}&longitude=${state.lng}&method=${state.method}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!Array.isArray(j?.data)) throw new Error("bad response");
    const days = j.data.map((d) => {
      const hj = d.date?.hijri;
      return {
        g: d.date?.gregorian?.day || "",
        weekday: d.date?.gregorian?.weekday?.en || "",
        h: hj ? `${hj.day} ${hj.month.en}` : "",
        hDay: hj?.day || "",
        hMonth: hj?.month?.en || "",
        hMonthAr: hj?.month?.ar || "",
        hMonthNum: hj?.month?.number || null,
        hYear: hj?.year || "",
        timings: {
          Fajr: cleanTime(d.timings.Fajr),
          Dhuhr: cleanTime(d.timings.Dhuhr),
          Asr: cleanTime(d.timings.Asr),
          Maghrib: cleanTime(d.timings.Maghrib),
          Isha: cleanTime(d.timings.Isha),
        },
      };
    });
    const entry = { days, fetchedAt: Date.now() };
    state.scheduleCache = { ...(state.scheduleCache || {}), [key]: entry };
    storage.set({ scheduleCache: state.scheduleCache });
    _scheduleData = { ym, key, days, error: null, loading: false };
  } catch (e) {
    if (_scheduleData) _scheduleData.error = "Failed to load schedule — check your connection.";
    if (_scheduleData) _scheduleData.loading = false;
    if (!_scheduleData?.days) _scheduleData = { ym, key, days: null, error: "Failed to load schedule.", loading: false };
  } finally {
    _scheduleLoadingKey = null;
    if (state.view === "schedule") patchSchedule();
  }
}

function scheduleHeaderHTML() {
  const ym = currentScheduleYM();
  const [y, m] = ym.split("-").map(Number);
  const monthName = MONTH_NAMES[m - 1];
  // Hijri label: derive a range from first/last day so month transitions are visible.
  let hijriLabel = "";
  const days = _scheduleData?.days || [];
  if (days.length) {
    const first = days[0];
    const last = days[days.length - 1];
    if (first?.hMonth && last?.hMonth) {
      if (first.hMonth === last.hMonth && first.hYear === last.hYear) {
        hijriLabel = `${first.hMonth} ${first.hYear} AH`;
      } else {
        const yA = first.hYear, yB = last.hYear;
        hijriLabel = yA === yB
          ? `${first.hMonth} → ${last.hMonth} ${yB} AH`
          : `${first.hMonth} ${yA} → ${last.hMonth} ${yB} AH`;
      }
    }
  }
  const mode = state.scheduleDateMode === "h" ? "h" : "g";
  return `
    <div class="sched-head">
      <button class="icon-btn" id="schedPrev" title="Previous month">${icon.prev}</button>
      <div class="sched-title">
        <div class="sched-month">${monthName} ${y}</div>
        ${hijriLabel ? `<div class="sched-hijri">${hijriLabel}</div>` : ""}
      </div>
      <button class="icon-btn" id="schedNext" title="Next month">${icon.next}</button>
    </div>
    <div class="sched-mode" role="tablist">
      <button class="sched-mode-btn ${mode === "g" ? "active" : ""}" data-mode="g" role="tab">Gregorian</button>
      <button class="sched-mode-btn ${mode === "h" ? "active" : ""}" data-mode="h" role="tab">Hijri</button>
    </div>`;
}

function scheduleBodyHTML() {
  if (_scheduleData?.error && !_scheduleData?.days) {
    return `<div class="sched-msg">${_scheduleData.error} <button class="loc-btn" id="schedRetry">Retry</button></div>`;
  }
  if (!_scheduleData?.days) {
    return `<div class="sched-msg">Loading schedule…</div>`;
  }
  const mode = state.scheduleDateMode === "h" ? "h" : "g";
  const ym = currentScheduleYM();
  const today = new Date();
  const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const todayDay = today.getDate();
  const isCurrentMonth = ym === todayYM;
  let prevHMonth = null;
  const rows = _scheduleData.days.map((d) => {
    const isToday = isCurrentMonth && parseInt(d.g, 10) === todayDay;
    const rollover = prevHMonth !== null && d.hMonth && d.hMonth !== prevHMonth;
    prevHMonth = d.hMonth || prevHMonth;
    const evt = hijriEventName(d.hMonthNum, d.hDay);
    const wd = (d.weekday || "").toLowerCase();
    const isSunnahFast = state.sunnahFastHighlight && (wd === "monday" || wd === "thursday");
    const fastTitle = wd === "monday" ? "Sunnah fast — Monday" : "Sunnah fast — Thursday";
    const classes = [
      isToday ? "today" : "",
      rollover ? "hijri-rollover" : "",
      evt ? "hijri-event" : "",
      isSunnahFast ? "sunnah-fast" : "",
    ].filter(Boolean).join(" ");
    const evtBadge = evt ? `<span class="sched-event" title="${evt}">★</span>` : "";
    const fastBadge = isSunnahFast ? `<span class="sched-fast" title="${fastTitle}">صوم</span>` : "";
    let dateCell;
    if (mode === "h") {
      const hijriMain = d.hDay
        ? (rollover
            ? `<b>${d.hDay}</b><span class="wd">${d.hMonth} ${d.hYear}</span>`
            : `<b>${d.hDay}</b><span class="wd">${(d.hMonth || "").slice(0, 8)}</span>`)
        : "";
      dateCell = `<td class="d h-primary">${hijriMain}${evtBadge}${fastBadge}</td>`;
    } else {
      dateCell = `<td class="d"><b>${d.g}</b><span class="wd">${(d.weekday || "").slice(0, 3)}</span>${evtBadge}${fastBadge}</td>`;
    }
    return `<tr class="${classes}">
      ${dateCell}
      <td>${fmt12(d.timings.Fajr)}</td>
      <td>${fmt12(d.timings.Dhuhr)}</td>
      <td>${fmt12(d.timings.Asr)}</td>
      <td>${fmt12(d.timings.Maghrib)}</td>
      <td>${fmt12(d.timings.Isha)}</td>
    </tr>`;
  }).join("");
  const dateHeader = mode === "h" ? "Hijri" : "Date";
  return `
    <div class="sched-table-wrap">
      <table class="sched-table">
        <thead><tr><th>${dateHeader}</th><th>Fajr</th><th>Dhuhr</th><th>Asr</th><th>Maghrib</th><th>Isha</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${_scheduleData.loading ? `<div class="sched-msg subtle">Updating…</div>` : ""}`;
}

function scheduleFooterHTML() {
  const where = state.locationName || `${Number(state.lat).toFixed(2)}, ${Number(state.lng).toFixed(2)}`;
  const methodName = (METHODS.find(([v]) => v === state.method) || [, `Method ${state.method}`])[1];
  return `
    <div class="sched-foot">
      <span>${where} · ${methodName}</span>
      <button class="sched-csv" id="schedCsv" title="Download CSV">Export CSV</button>
    </div>`;
}

function renderSchedule() {
  return `
    <div class="app">
      <div class="settings-head">
        <button class="icon-btn" data-go="home">${icon.back}</button>
        <h1>Schedule</h1>
        <span style="width:30px"></span>
      </div>
      <div id="schedHead">${scheduleHeaderHTML()}</div>
      <div id="schedBody">${scheduleBodyHTML()}</div>
      <div id="schedFoot">${scheduleFooterHTML()}</div>
    </div>
  `;
}

function patchSchedule() {
  const head = $("#schedHead"); if (head) setHTML(head, scheduleHeaderHTML());
  const body = $("#schedBody"); if (body) setHTML(body, scheduleBodyHTML());
  const foot = $("#schedFoot"); if (foot) setHTML(foot, scheduleFooterHTML());
  wireSchedule();
}

function downloadScheduleCsv() {
  if (!_scheduleData?.days) return;
  const ym = currentScheduleYM();
  const header = ["Gregorian", "Weekday", "Hijri", "Hijri Month", "Hijri Year", "Event", "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const rows = _scheduleData.days.map((d) => [
    `${ym}-${String(d.g).padStart(2, "0")}`,
    d.weekday || "",
    d.hDay || "",
    d.hMonth || "",
    d.hYear || "",
    hijriEventName(d.hMonthNum, d.hDay),
    d.timings.Fajr, d.timings.Dhuhr, d.timings.Asr, d.timings.Maghrib, d.timings.Isha,
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `zakkir-schedule-${ym}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wireSchedule() {
  const prev = $("#schedPrev");
  if (prev) prev.addEventListener("click", () => {
    state.scheduleMonth = stepScheduleMonth(-1);
    storage.set({ scheduleMonth: state.scheduleMonth });
    fetchMonth(state.scheduleMonth);
    patchSchedule();
  });
  const next = $("#schedNext");
  if (next) next.addEventListener("click", () => {
    state.scheduleMonth = stepScheduleMonth(1);
    storage.set({ scheduleMonth: state.scheduleMonth });
    fetchMonth(state.scheduleMonth);
    patchSchedule();
  });
  const retry = $("#schedRetry");
  if (retry) retry.addEventListener("click", () => { fetchMonth(currentScheduleYM()); patchSchedule(); });
  const csv = $("#schedCsv");
  if (csv) csv.addEventListener("click", downloadScheduleCsv);
  document.querySelectorAll(".sched-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-mode") === "h" ? "h" : "g";
      if (state.scheduleDateMode === mode) return;
      state.scheduleDateMode = mode;
      storage.set({ scheduleDateMode: mode });
      patchSchedule();
    });
  });
}

// ---------- themed dropdown (replaces native <select> in our UI) ----------
const dCaret = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ts-caret"><path d="M6 9l6 6 6-6"/></svg>`;
function dropdownHTML(id, value, options, opts = {}) {
  const cur = options.find((o) => String(o.v) === String(value));
  const label = cur ? cur.l : (opts.placeholder || "—");
  return `<div class="ts-wrap${opts.full ? " ts-full" : ""}" data-ts="${id}">
    <button type="button" class="ts-btn" data-ts-btn aria-haspopup="listbox">
      <span class="ts-label">${label}</span>${dCaret}
    </button>
    <div class="ts-menu" data-ts-menu role="listbox" hidden>
      ${options.map((o) => `<div class="ts-item${String(o.v) === String(value) ? " active" : ""}" role="option" data-ts-item="${String(o.v).replace(/"/g, "&quot;")}">${o.l}</div>`).join("")}
    </div>
  </div>`;
}
function wireDropdowns(handlers, root) {
  (root || document).querySelectorAll("[data-ts]").forEach((wrap) => {
    const id = wrap.dataset.ts;
    // Only wire dropdowns this caller actually handles — prevents double-binding
    // when both the global wire() and a scoped wireLocation()/patchAzkarCard()
    // run over overlapping regions (would otherwise toggle the menu twice on
    // the first click, making it appear "frozen").
    if (!handlers || !(id in handlers)) return;
    const btn = wrap.querySelector("[data-ts-btn]");
    const menu = wrap.querySelector("[data-ts-menu]");
    if (!btn || !menu) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !menu.hidden;
      document.querySelectorAll("[data-ts-menu]").forEach((m) => (m.hidden = true));
      document.querySelectorAll("[data-ts]").forEach((w) => w.classList.remove("open"));
      if (!open) { menu.hidden = false; wrap.classList.add("open"); }
    });
    menu.querySelectorAll("[data-ts-item]").forEach((it) =>
      it.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = it.dataset.tsItem;
        menu.hidden = true;
        wrap.classList.remove("open");
        handlers[id]?.(v);
      })
    );
  });
  if (!document._tsOutsideBound) {
    document.addEventListener("click", () => {
      document.querySelectorAll("[data-ts-menu]").forEach((m) => (m.hidden = true));
      document.querySelectorAll("[data-ts]").forEach((w) => w.classList.remove("open"));
    });
    document._tsOutsideBound = true;
  }
}

// ---------- Smart location card (Electron: GPS / Map / City + advanced) ----------
function locationCardHTML() {
  const method = state.locationMethod || "manual";
  const srcLabel = { preset: "via city", detect: "via GPS", map: "via map", manual: "via manual" }[method] || "";
  const resolved = state.locationName || `${Number(state.lat).toFixed(3)}, ${Number(state.lng).toFixed(3)}`;
  const tab = ["gps", "map", "city"].includes(state.locationTab)
    ? state.locationTab
    : (method === "detect" ? "gps" : method === "map" ? "map" : "city");

  let activeCountry = "";
  let activeCity = "";
  for (const [country, cities] of Object.entries(PRESETS)) {
    for (const [city, coords] of Object.entries(cities)) {
      if (Math.abs(coords[0] - state.lat) < 0.001 && Math.abs(coords[1] - state.lng) < 0.001) {
        activeCountry = country;
        activeCity = city;
        break;
      }
    }
    if (activeCountry) break;
  }

  const panel =
    tab === "gps"
      ? `<div class="loc-panel">
          <button class="loc-btn primary" id="detectBtn">Detect my location</button>
          <div class="loc-sub">Uses your device's location. You'll be asked once for permission.</div>
        </div>`
      : tab === "map"
      ? `<div class="loc-panel">
          <button class="loc-btn primary" id="pickMap">Open map picker</button>
          <div class="loc-sub">Click anywhere on the map or search to drop a pin.</div>
        </div>`
      : `<div class="loc-panel">
          <div class="row">
            <label>Country</label>
            <select id="presetCountry">
              <option value="">-- Select Country --</option>
              ${Object.keys(PRESETS).map((c) => `<option value="${c}" ${c === activeCountry ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="row">
            <label>City</label>
            <select id="presetCity">
              <option value="">-- Select City --</option>
              ${activeCountry ? Object.keys(PRESETS[activeCountry]).map((c) => `<option value="${c}" ${c === activeCity ? "selected" : ""}>${c}</option>`).join("") : ""}
            </select>
          </div>
        </div>`;
  return `
    <div class="loc-card">
      <div class="loc-current">
        <div class="loc-resolved">${resolved}</div>
        ${srcLabel ? `<span class="loc-chip">${srcLabel}</span>` : ""}
      </div>
      <div class="seg" role="tablist">
        ${[["gps", "GPS"], ["map", "Map"], ["city", "City"]].map(([id, lbl]) => `<button type="button" class="seg-btn ${tab === id ? "active" : ""}" data-tab="${id}">${lbl}</button>`).join("")}
      </div>
      ${panel}
    </div>
  `;
}

function patchLocation() {
  const el = $("#locRegion");
  if (!el) { render(); return; }
  setHTML(el, locationCardHTML());
  wireLocation();
}

function wireLocation() {
  const root = $("#locRegion");
  if (!root) return;
  document.querySelectorAll("#locRegion [data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.locationTab = b.dataset.tab;
      storage.set({ locationTab: state.locationTab });
      patchLocation();
    })
  );
  const detect = $("#detectBtn");
  if (detect) detect.addEventListener("click", async () => {
    detect.textContent = "Detecting…";
    detect.disabled = true;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
      const lat = +pos.coords.latitude.toFixed(4);
      const lng = +pos.coords.longitude.toFixed(4);
      const name = await reverseGeocode(lat, lng);
      state.lat = lat; state.lng = lng; state.locationName = name; state.locationMethod = "detect"; state.locationTab = "gps";
      storage.set({ lat, lng, locationName: name, locationMethod: "detect", locationTab: "gps", prayerCache: null });
      patchLocation();
      await loadPrayers(true);
      patchPrayerCard();
    } catch {
      detect.textContent = "Failed — try manual";
      detect.disabled = false;
    }
  });
  const pick = $("#pickMap");
  if (pick) pick.addEventListener("click", () => update({ view: "map" }));

  const presetCountry = $("#presetCountry");
  const presetCity = $("#presetCity");
  if (presetCountry && presetCity) {
    const applyPreset = async (country, city) => {
      if (!country || !city || !PRESETS[country] || !PRESETS[country][city]) return;
      const coords = PRESETS[country][city];
      const lat = coords[0];
      const lng = coords[1];
      state.lat = lat;
      state.lng = lng;
      state.locationName = `${city}, ${country.split(" (")[0]}`;
      state.locationMethod = "preset";
      storage.set({ lat, lng, locationName: state.locationName, locationMethod: "preset", prayerCache: null });
      const latInput = $("#latInput");
      const lngInput = $("#lngInput");
      if (latInput) latInput.value = lat.toFixed(4);
      if (lngInput) lngInput.value = lng.toFixed(4);
      patchLocation();
      await loadPrayers(true);
      patchPrayerCard();
    };
    presetCountry.addEventListener("change", async (e) => {
      const country = e.target.value;
      presetCity.innerHTML = '<option value="">-- Select City --</option>';
      if (country && PRESETS[country]) {
        Object.keys(PRESETS[country]).forEach((city) => {
          const opt = document.createElement("option");
          opt.value = city;
          opt.textContent = city;
          presetCity.appendChild(opt);
        });
        await applyPreset(country, Object.keys(PRESETS[country])[0]);
      }
    });
    presetCity.addEventListener("change", (e) => {
      applyPreset(presetCountry.value, e.target.value);
    });
  }

  const adv = document.querySelector(".loc-adv");
  if (adv) adv.addEventListener("toggle", () => {
    state.locationAdvancedOpen = adv.open;
    storage.set({ locationAdvancedOpen: adv.open });
  });
}

// ---------- Settings: sections & notifications ----------
function themeCardsHTML(themes, featured = false) {
  return themes.map(([id, label]) => `
    <button class="theme-card ${featured ? "theme-featured" : ""} ${state.theme === id ? "active" : ""}" data-theme="${id}">
      <div class="sw" data-theme-sw="${id}"></div><span class="theme-name">${label}</span>
    </button>`).join("");
}
const CLASSIC_THEME_INDEX = THEMES.findIndex(([id]) => id === "light");
const DESIGN_ERA_THEME_COUNT = 3;
const GLASS_THEME_COUNT = 3;
const BOLD_THEME_COUNT = 2;
const GLASS_THEME_START = DESIGN_ERA_THEME_COUNT;
const BOLD_THEME_START = GLASS_THEME_START + GLASS_THEME_COUNT;
const FEATURED_THEME_COUNT = BOLD_THEME_START + BOLD_THEME_COUNT;

const SETTINGS_SECTIONS = ["general", "notifications", "reading", "appearance", "window"];
const SETTINGS_NAV = [["general", "General"], ["notifications", "Notifications"], ["reading", "Reading"], ["appearance", "Appearance"], ["window", "Window"]];
const SETTINGS_META = {
  general: ["General", "Set your prayer location and schedule preferences."],
  notifications: ["Notifications", "Choose when Zakkir should remind you."],
  reading: ["Reading", "Tune Arabic text for comfortable daily reading."],
  appearance: ["Appearance", "Choose the visual atmosphere and accent color."],
  window: ["Window", "Adjust the popup to fit the way you use it."],
};

function settingsSectionHTML(id, title, description, body) {
  return `<section class="settings-section" data-settings-panel="${id}">
    <div class="settings-section-intro"><div class="sec">${title}</div><p>${description}</p></div>
    ${body}
  </section>`;
}

function minuteOptions(value, values) {
  const options = values.includes(value) ? values : [...values, value].sort((a, b) => a - b);
  return options.map((minutes) => `<option value="${minutes}" ${value === minutes ? "selected" : ""}>${minutes} min</option>`).join("");
}

function notificationSummary() {
  if (!state.notificationsEnabled) return "Prayer notifications are paused. Your choices are saved.";
  const prayers = (state.reminderPrayers || []).filter((prayer) => PRAYER_ORDER.includes(prayer));
  if (!prayers.length) return "Choose at least one prayer to start receiving notifications.";
  const moments = [];
  if (state.remindersEnabled) moments.push(`${state.reminderMinutes} minutes before`);
  if (state.prayerAlertEnabled) moments.push("at athan");
  if (state.iqamaEnabled) moments.push(`${state.iqamaMinutes} minutes after`);
  if (!moments.length) return "Choose when you would like to be notified.";
  const prayerText = prayers.length === PRAYER_ORDER.length ? "all five prayers" : prayers.join(", ");
  return `You will be notified ${moments.join(", ")} for ${prayerText}.`;
}

function syncNotificationUI() {
  const enabled = state.notificationsEnabled;
  const config = document.querySelector(".notification-config");
  config?.classList.toggle("is-paused", !enabled);
  const master = $("#notificationsEnabled");
  if (master) master.checked = enabled;
  for (const [id, active] of [["remindersEnabled", state.remindersEnabled], ["prayerAlertEnabled", state.prayerAlertEnabled], ["iqamaEnabled", state.iqamaEnabled]]) {
    const input = $("#" + id);
    if (!input) continue;
    input.checked = active;
    input.disabled = !enabled;
    input.closest(".timeline-item")?.classList.toggle("enabled", active);
  }
  for (const [id, active, value] of [["reminderMinutes", state.remindersEnabled, state.reminderMinutes], ["iqamaMinutes", state.iqamaEnabled, state.iqamaMinutes]]) {
    const select = $("#" + id);
    if (!select) continue;
    select.disabled = !enabled || !active;
    select.value = String(value);
  }
  document.querySelectorAll("[data-rp]").forEach((input) => {
    const active = (state.reminderPrayers || []).includes(input.dataset.rp);
    input.checked = active;
    input.disabled = !enabled;
    input.closest(".pt")?.classList.toggle("on", active);
  });
  document.querySelectorAll("[data-prayer-action]").forEach((button) => { button.disabled = !enabled; });
  const summary = document.querySelector(".notification-confirmation p");
  if (summary) summary.textContent = notificationSummary();
  document.querySelector(".notification-confirmation")?.classList.toggle("paused", !enabled);
}

const SOUNDS = [
  ["adhan-makkah", "Adhan (Makkah)"],
  ["adhan-medina", "Adhan (Medina)"],
  ["adhan-egypt", "Adhan (Egypt)"],
  ["chime", "Chime"],
  ["bell", "Bell"],
  ["soft-ping", "Soft Ping"],
  ["silent", "Silent"],
];

function settingsBodyHTML(id) {
  if (id === "general") return `
    <div id="locRegion">${locationCardHTML()}</div>
    <details class="loc-adv" ${state.locationAdvancedOpen ? "open" : ""}>
      <summary>Advanced (manual coordinates)</summary>
      <div class="row"><label>Latitude</label><input class="input" id="latInput" type="number" step="0.0001" placeholder="e.g. 30.0444" value="${state.lat?.toFixed ? state.lat.toFixed(4) : ""}" /></div>
      <div class="row"><label>Longitude</label><input class="input" id="lngInput" type="number" step="0.0001" placeholder="e.g. 31.2357" value="${state.lng?.toFixed ? state.lng.toFixed(4) : ""}" /></div>
      <button class="loc-btn" id="useCoordsBtn" style="width:100%;margin:2px 0 8px">Use These Coordinates</button>
    </details>
    <div class="settings-card"><div class="row"><label>Calculation method</label>${dropdownHTML("method", state.method, METHODS.map(([v, n]) => ({ v, l: n })))}</div>
      <div class="row"><label>Highlight Mon/Thu (Sunnah fasting)</label><label class="switch"><input type="checkbox" id="sunnahFastHighlight" ${state.sunnahFastHighlight ? "checked" : ""}/><span></span></label></div>
      ${globalThis.electronAPI ? `<div class="row"><label>Show update alerts</label><label class="switch"><input type="checkbox" id="updateAlertsEnabled" ${state.updateAlertsEnabled ? "checked" : ""}/><span></span></label></div>` : ""}
    </div>`;
  if (id === "notifications") {
    const notificationsOff = !state.notificationsEnabled;
    return `
    <div class="notification-master settings-card"><div><strong>Prayer notifications</strong><span>Receive timely reminders around each prayer.</span></div><label class="switch" aria-label="Prayer notifications"><input type="checkbox" id="notificationsEnabled" ${state.notificationsEnabled ? "checked" : ""}/><span></span></label></div>
    <div class="notification-config ${notificationsOff ? "is-paused" : ""}" aria-disabled="${notificationsOff}">
      <div class="notification-block settings-card"><div class="notification-block-head"><div><span class="notification-kicker">When to notify</span><strong>Prayer timeline</strong></div></div>
        <div class="notification-timeline">
          <div class="timeline-item ${state.remindersEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>Before athan</strong><span>Give me time to prepare.</span><select id="reminderMinutes" aria-label="Minutes before athan" ${!state.remindersEnabled || notificationsOff ? "disabled" : ""}>${minuteOptions(state.reminderMinutes, [5,10,15,20,30,45,60])}</select></div><label class="switch"><input type="checkbox" id="remindersEnabled" ${state.remindersEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
          <div class="timeline-item ${state.prayerAlertEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>At athan</strong><span>Notify me when prayer time begins.</span></div><label class="switch"><input type="checkbox" id="prayerAlertEnabled" ${state.prayerAlertEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
          <div class="timeline-item ${state.iqamaEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>After athan</strong><span>Remind me for iqama.</span><select id="iqamaMinutes" aria-label="Minutes after athan" ${!state.iqamaEnabled || notificationsOff ? "disabled" : ""}>${minuteOptions(state.iqamaMinutes, [5,10,15,20,25,30])}</select></div><label class="switch"><input type="checkbox" id="iqamaEnabled" ${state.iqamaEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        </div>
      </div>
      <div class="notification-block settings-card"><div class="notification-block-head"><div><span class="notification-kicker">Prayers</span><strong>Apply reminders to</strong></div><div class="prayer-actions"><button type="button" data-prayer-action="all" ${notificationsOff ? "disabled" : ""}>All</button><button type="button" data-prayer-action="clear" ${notificationsOff ? "disabled" : ""}>Clear</button></div></div><div class="prayer-toggles">${PRAYER_ORDER.map((p) => `<label class="pt ${(state.reminderPrayers || []).includes(p) ? "on" : ""}"><input type="checkbox" data-rp="${p}" ${(state.reminderPrayers || []).includes(p) ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span>${p}</span></label>`).join("")}</div></div>
      <div class="settings-card"><div class="settings-card-title">Reminder sound</div><div class="sound-grid">${SOUNDS.map(([id, label]) => `<label class="sound-option ${state.reminderSound === id ? "active" : ""}" data-sound="${id}"><input type="radio" name="reminderSound" value="${id}" ${state.reminderSound === id ? "checked" : ""} style="display:none">${label}</label>`).join("")}</div><div class="sound-actions"><button class="loc-btn" id="testSoundBtn">Test Sound</button></div></div>
    </div>
    <div class="notification-confirmation ${state.notificationsEnabled ? "" : "paused"}"><span class="confirmation-dot"></span><p>${notificationSummary()}</p></div>`;
  }
  if (id === "reading") return `<div class="settings-card"><div class="font-grid">${Object.keys(FONT_MAP).map((f) => `<button class="pill ${state.font === f ? "active" : ""}" data-font="${f}" aria-label="${f}"><span class="font-sample">أبجد</span><span>${f}</span></button>`).join("")}</div><div class="row"><label>Arabic size</label><input type="range" min="0.7" max="2" step="0.05" value="${state.arSize}" id="arSize"/><span>${state.arSize.toFixed(2)}×</span></div><div class="preview">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></div>`;
  if (id === "appearance") return `<div class="settings-card"><div class="theme-intro">Choose a complete visual system. Themes can change geometry, depth, texture, motion, and color. The accent palette remains customizable.</div><div class="theme-collection-title"><span>Design eras</span><span>${DESIGN_ERA_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(0, GLASS_THEME_START), true)}</div><div class="theme-collection-title classic-title"><span>Glass and depth</span><span>${GLASS_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(GLASS_THEME_START, BOLD_THEME_START), true)}</div><div class="theme-collection-title classic-title"><span>Bold and experimental</span><span>${BOLD_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(BOLD_THEME_START, FEATURED_THEME_COUNT), true)}</div>${state.theme === "neobrutal" ? `<div class="neobrutal-tone">${neobrutalToneHTML()}</div>` : ""}<div class="theme-collection-title classic-title"><span>Atmospheric themes</span><span>${THEMES.slice(FEATURED_THEME_COUNT, CLASSIC_THEME_INDEX).length}</span></div><div class="theme-grid">${themeCardsHTML(THEMES.slice(FEATURED_THEME_COUNT, CLASSIC_THEME_INDEX))}</div><details class="settings-advanced"><summary>Browse classic themes (${THEMES.slice(CLASSIC_THEME_INDEX).length})</summary><div class="theme-grid">${themeCardsHTML(THEMES.slice(CLASSIC_THEME_INDEX))}</div></details></div><div class="settings-card"><div class="settings-card-title">Accent color</div><div class="palette-grid">${Object.entries(PALETTES).map(([id, p]) => `<button class="palette-chip ${state.palette === id ? "active" : ""}" data-palette="${id}" title="${p.name}" style="background:${p.a || "transparent"};${!p.a ? "background:repeating-linear-gradient(45deg,var(--surface-2) 0 4px,var(--line) 4px 8px);" : ""}"></button>`).join("")}</div></div>`;
  if (id === "window") return `<div class="settings-card"><div class="row"><label>UI zoom</label><div class="zoom-row"><button class="zoom-btn" data-zoom="-0.1">−</button><span class="zoom-val">${Math.round(state.zoom * 100)}%</span><button class="zoom-btn" data-zoom="0.1">+</button></div></div><div class="row"><label>Width</label><input type="range" min="360" max="900" step="10" value="${state.popupW}" id="popupW"/><span>${state.popupW}px</span></div><div class="row"><label>Height</label><input type="range" min="480" max="900" step="10" value="${state.popupH}" id="popupH"/><span>${state.popupH}px</span></div></div>`;
  return "";
}
function buildSettingsSection(id) {
  const [title, description] = SETTINGS_META[id];
  return settingsSectionHTML(id, title, description, settingsBodyHTML(id));
}
function renderSettings() {
  const active = SETTINGS_SECTIONS.includes(state.settingsSection) ? state.settingsSection : "general";
  return `<div class="app settings-view"><div class="settings-head"><button class="icon-btn" data-go="home">${icon.back}</button><h1>Settings</h1><span style="width:30px"></span></div><nav class="settings-nav" aria-label="Settings sections">${SETTINGS_NAV.map(([id, label]) => `<button type="button" class="settings-nav-btn ${active === id ? "active" : ""}" data-settings-section="${id}">${label}</button>`).join("")}</nav>${buildSettingsSection(active)}</div>`;
}
function htmlToNode(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.firstElementChild;
}
function renderSettingsSectionInPlace() {
  const old = document.querySelector(".settings-section");
  if (!old || state.view !== "settings") { render(); return; }
  const active = SETTINGS_SECTIONS.includes(state.settingsSection) ? state.settingsSection : "general";
  old.replaceWith(htmlToNode(buildSettingsSection(active)));
  document.querySelectorAll("[data-settings-section]").forEach((b) => b.classList.toggle("active", b.dataset.settingsSection === active));
  wireSettings();
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
  for (const id of validThemes) {
    document.documentElement.classList.remove("theme-" + id);
    if (THEME_BASES[id]) document.documentElement.classList.remove("theme-" + THEME_BASES[id]);
  }
  const theme = validThemes.includes(state.theme) ? state.theme : DEFAULTS.theme;
  document.documentElement.classList.add("theme-" + theme);
  if (THEME_BASES[theme]) document.documentElement.classList.add("theme-" + THEME_BASES[theme]);
  document.documentElement.classList.toggle("neobrutal-high", state.neobrutalContrast === "high");
  const font = FONT_MAP[state.font] ? state.font : "Scheherazade";
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
  if (state.view === "map") {
    setHTML(app, renderMap());
    wireMap();
  } else {
    const html = state.view === "settings" ? renderSettings()
      : state.view === "schedule" ? renderSchedule()
      : renderHome();
    setHTML(app, html);
    wire();
  }
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
    setHTML(cat, catRowHTML());
    wireDropdowns({
      catPick: (v) => {
        state.autoTime = false;
        storage.set({ autoTime: false });
        update({ category: v, azkarIndex: 0, azkarCount: 0 });
      },
    }, cat);
  }
  const nav = $("#navIndicator");
  if (nav) nav.textContent = navIndicatorText();
}

function patchPrayerCard() {
  const el = $("#prayerRegion"); if (el) setHTML(el, prayerCardHTML());
  // re-wire prayer tap after patch
  wirePrayerTap();
}

function patchPrayerDetail() {
  const el = $("#prayerDetail");
  if (el) setHTML(el, activePrayer ? detailHTML(activePrayer) : "");
  document.querySelectorAll(".prayer").forEach(d => {
    d.classList.toggle("tapped", d.dataset.prayer === activePrayer);
  });
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

const VAR_ONLY_KEYS = new Set(["font", "arSize", "theme", "palette", "neobrutalContrast", "zoom", "popupW", "popupH"]);
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
  document.querySelectorAll("[data-settings-section]").forEach((b) =>
    b.addEventListener("click", () => {
      state.settingsSection = b.dataset.settingsSection;
      renderSettingsSectionInPlace();
    })
  );

  if (state.view === "schedule") {
    const ym = currentScheduleYM();
    if (!_scheduleData || _scheduleData.ym !== ym) {
      fetchMonth(ym);
    }
    wireSchedule();
  }

  // Home interactions
  wirePrayerTap();
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
      persistAzkarCount(next);
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
  // Themed dropdowns (replaces native <select>)
  wireDropdowns({
    catPick: (v) => {
      state.autoTime = false;
      storage.set({ autoTime: false });
      update({ category: v, azkarIndex: 0, azkarCount: 0 });
    },
  });
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

  const minimizeBtn = $("#minimizeBtn");
  if (minimizeBtn) minimizeBtn.addEventListener("click", () => {
    if (globalThis.electronAPI) {
      globalThis.electronAPI.minimizeWindow();
    }
  });

  const closeBtn = $("#closeBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (globalThis.electronAPI) {
      globalThis.electronAPI.closeWindow();
    }
  });

  if (state.view === "settings") wireSettings();
}

function neobrutalToneHTML() {
  return `<span>Neobrutalist contrast</span><div class="seg"><button class="seg-btn ${state.neobrutalContrast === "quiet" ? "active" : ""}" data-neobrutal-contrast="quiet">Quiet</button><button class="seg-btn ${state.neobrutalContrast === "high" ? "active" : ""}" data-neobrutal-contrast="high">High contrast</button></div>`;
}

function wireSettings() {
  wireDropdowns({
    method: async (v) => {
      state.method = parseInt(v, 10);
      storage.set({ method: state.method });
      await loadPrayers(true);
      render();
    },
  });
  if (state.settingsSection === "general") wireLocation();
  // Track Advanced disclosure open state
  const adv = document.querySelector(".loc-adv");
  if (adv) adv.addEventListener("toggle", () => {
    state.locationAdvancedOpen = adv.open;
    storage.set({ locationAdvancedOpen: adv.open });
  });

  document.querySelectorAll("[data-font]").forEach((b) => {
    b.querySelector(".font-sample")?.style.setProperty("font-family", FONT_MAP[b.dataset.font]);
    b.addEventListener("click", () => {
      update({ font: b.dataset.font });
      patchSettingsActive("data-font", b.dataset.font);
    });
  });
  document.querySelectorAll("[data-theme]").forEach((b) =>
    b.addEventListener("click", () => {
      const previousTheme = state.theme;
      update({ theme: b.dataset.theme });
      patchSettingsActive("data-theme", b.dataset.theme);
      const tone = document.querySelector(".neobrutal-tone");
      if (b.dataset.theme === "neobrutal" && !tone) {
        const picker = document.createElement("div");
        picker.className = "neobrutal-tone";
        picker.innerHTML = neobrutalToneHTML();
        b.closest(".theme-grid")?.after(picker);
        picker.querySelectorAll("[data-neobrutal-contrast]").forEach((button) => button.addEventListener("click", () => {
          update({ neobrutalContrast: button.dataset.neobrutalContrast });
          patchSettingsActive("data-neobrutal-contrast", button.dataset.neobrutalContrast);
        }));
      } else if (previousTheme === "neobrutal" && b.dataset.theme !== "neobrutal") {
        tone?.remove();
      }
    })
  );
  document.querySelectorAll("[data-palette]").forEach((b) =>
    b.addEventListener("click", () => {
      update({ palette: b.dataset.palette });
      patchSettingsActive("data-palette", b.dataset.palette);
    })
  );
  document.querySelectorAll("[data-neobrutal-contrast]").forEach((b) =>
    b.addEventListener("click", () => {
      update({ neobrutalContrast: b.dataset.neobrutalContrast });
      patchSettingsActive("data-neobrutal-contrast", b.dataset.neobrutalContrast);
    })
  );
  // paint theme swatches with each theme's accent/bg preview
  const THEME_SW = {
    metro:       { bg: "#f1f1f1", a: "#e11d48", style: "metro" },
    material:    { bg: "#eef2f6", a: "#6750a4", style: "material" },
    neumorphic:  { bg: "#dce3e8", a: "#315f75", style: "neumorphic" },
    aqua:        { bg: "linear-gradient(180deg,#edf3ed,#a9c4bd)", a: "#5c827a", style: "aqua" },
    liquidglass: { bg: "linear-gradient(135deg,#e7ebe6,#cbd2ce 48%,#dfdfd7)", a: "#657d77", style: "liquidglass" },
    frutiger:    { bg: "linear-gradient(180deg,#d3e1dc 0 48%,#aabd9b 49%)", a: "#5d8778", style: "frutiger" },
    neobrutal:   { bg: "#d8d0bd", a: "#657d70", style: "neobrutal" },
    webbrutal:   { bg: "#f2f2ed", a: "#49665b", style: "webbrutal" },
    "metro-dark":       { bg: "#151719", a: "#69aa98", style: "metro" },
    "material-dark":    { bg: "#17181d", a: "#b5a3d4", style: "material" },
    "neumorphic-dark":  { bg: "#222a2e", a: "#78ad9e", style: "neumorphic" },
    "aqua-dark":        { bg: "linear-gradient(180deg,#183139,#0c1c22)", a: "#79b7a9", style: "aqua" },
    "liquidglass-dark": { bg: "linear-gradient(135deg,#18211f,#29322f 48%,#111817)", a: "#8bb6a8", style: "liquidglass" },
    "frutiger-dark":    { bg: "linear-gradient(180deg,#243b42 0 48%,#1d3028 49%)", a: "#91b69b", style: "frutiger" },
    "editorial-dark":   { bg: "#1d1b19", a: "#c9826c", style: "editorial" },
    "softclay-dark":    { bg: "#292522", a: "#b58a70", style: "softclay" },
    "webbrutal-dark":   { bg: "#111312", a: "#8bb9a7", style: "webbrutal" },
    editorial:  { bg: "#f3efe6", a: "#b53824", style: "editorial" },
    blueprint:  { bg: "#102b42", a: "#68d4ff", style: "blueprint" },
    softclay:   { bg: "#ddd5ca", a: "#806454", style: "softclay" },
    control:    { bg: "#15191c", a: "#d8f34a", style: "control" },
    glass:      { bg: "linear-gradient(135deg,#102c38,#38555d)", a: "#8be0c7", style: "glass" },
    noor:       { bg: "linear-gradient(145deg,#fffaf0,#ead7a8)", a: "#b88632", style: "light" },
    celestial:  { bg: "linear-gradient(145deg,#080d2a,#263169)", a: "#b6c8ff", style: "stars" },
    sahara:     { bg: "linear-gradient(145deg,#f8e4c3,#d99361)", a: "#a94f2a", style: "dune" },
    andalus:    { bg: "linear-gradient(145deg,#092d2a,#286a5d)", a: "#d9bd76", style: "tile" },
    motherpearl:{ bg: "linear-gradient(135deg,#f8f5f1,#d9eced 48%,#eadde6)", a: "#397f80", style: "pearl" },
    minaret:    { bg: "linear-gradient(145deg,#eaf5f3,#a9d1cc)", a: "#126c6f", style: "arch" },
    olive:      { bg: "linear-gradient(145deg,#f0edda,#9eaa72)", a: "#576737", style: "leaf" },
    ramadan:    { bg: "linear-gradient(145deg,#21103b,#623970)", a: "#ffc96b", style: "lantern" },
    zen:        { bg: "linear-gradient(145deg,#eeece6,#aaa9a3)", a: "#52575a", style: "stone" },
    nightdune:  { bg: "linear-gradient(145deg,#101328,#3d3153)", a: "#e0b873", style: "nightdune" },
    wadi:       { bg: "linear-gradient(145deg,#092d3b,#54a8a3)", a: "#baf1d7", style: "wadi" },
    patina:     { bg: "linear-gradient(145deg,#123d3c,#987453)", a: "#e5b96c", style: "patina" },
    calligraphy:{ bg: "linear-gradient(145deg,#f5f2e9,#292827)", a: "#ba8d32", style: "calligraphy" },
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
      dot.className = `sw-scene sw-${t.style || "plain"}`;
      dot.style.setProperty("--sw-accent", t.a);
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
    if (globalThis.electronAPI) globalThis.electronAPI.resizeWindow(v, state.popupH);
  });
  const h = $("#popupH");
  if (h) h.addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    update({ popupH: v });
    patchSliderLabel("popupH", v + "px");
    if (globalThis.electronAPI) globalThis.electronAPI.resizeWindow(state.popupW, v);
  });

  // General: manual coordinates
  const useCoordsBtn = $("#useCoordsBtn");
  if (useCoordsBtn) useCoordsBtn.addEventListener("click", async () => {
    const lat = parseFloat($("#latInput")?.value);
    const lng = parseFloat($("#lngInput")?.value);
    if (isNaN(lat) || isNaN(lng)) return;
    const name = await reverseGeocode(lat, lng);
    state.lat = lat; state.lng = lng; state.locationName = name; state.locationMethod = "manual";
    storage.set({ lat, lng, locationName: name, locationMethod: "manual", prayerCache: null });
    patchLocation();
    await loadPrayers(true);
    patchPrayerCard();
  });

  // --- Settings: notifications ---
  const ne = $("#notificationsEnabled");
  if (ne) ne.addEventListener("change", (e) => {
    state.notificationsEnabled = e.target.checked;
    storage.set({ notificationsEnabled: state.notificationsEnabled });
    syncReminders();
    syncNotificationUI();
  });
  const re = $("#remindersEnabled");
  if (re) re.addEventListener("change", (e) => {
    state.remindersEnabled = e.target.checked;
    storage.set({ remindersEnabled: state.remindersEnabled });
    syncReminders();
    syncNotificationUI();
  });
  const ae = $("#prayerAlertEnabled");
  if (ae) ae.addEventListener("change", (e) => {
    state.prayerAlertEnabled = e.target.checked;
    storage.set({ prayerAlertEnabled: state.prayerAlertEnabled });
    syncReminders();
    syncNotificationUI();
  });
  const rm = $("#reminderMinutes");
  if (rm) rm.addEventListener("change", (e) => {
    state.reminderMinutes = parseInt(e.target.value, 10) || 10;
    storage.set({ reminderMinutes: state.reminderMinutes });
    syncReminders();
    syncNotificationUI();
  });
  const ie = $("#iqamaEnabled");
  if (ie) ie.addEventListener("change", (e) => {
    state.iqamaEnabled = e.target.checked;
    storage.set({ iqamaEnabled: state.iqamaEnabled });
    syncReminders();
    syncNotificationUI();
  });
  const im = $("#iqamaMinutes");
  if (im) im.addEventListener("change", (e) => {
    state.iqamaMinutes = parseInt(e.target.value, 10) || 10;
    storage.set({ iqamaMinutes: state.iqamaMinutes });
    syncReminders();
    syncNotificationUI();
  });
  document.querySelectorAll("[data-prayer-action]").forEach((button) =>
    button.addEventListener("click", () => {
      const selected = button.dataset.prayerAction === "all";
      state.reminderPrayers = selected ? [...PRAYER_ORDER] : [];
      storage.set({ reminderPrayers: state.reminderPrayers });
      syncReminders();
      syncNotificationUI();
    })
  );
  document.querySelectorAll("[data-rp]").forEach((c) =>
    c.addEventListener("change", (e) => {
      const name = e.target.dataset.rp;
      const set = new Set(state.reminderPrayers || []);
      if (e.target.checked) set.add(name); else set.delete(name);
      state.reminderPrayers = PRAYER_ORDER.filter((p) => set.has(p));
      storage.set({ reminderPrayers: state.reminderPrayers });
      syncReminders();
      syncNotificationUI();
    })
  );
  const sf = $("#sunnahFastHighlight");
  if (sf) sf.addEventListener("change", (e) => {
    state.sunnahFastHighlight = e.target.checked;
    storage.set({ sunnahFastHighlight: state.sunnahFastHighlight });
  });
  const ua = $("#updateAlertsEnabled");
  if (ua) ua.addEventListener("change", (e) => {
    state.updateAlertsEnabled = e.target.checked;
    storage.set({ updateAlertsEnabled: state.updateAlertsEnabled });
  });

  // Sound picker
  document.querySelectorAll("[data-sound]").forEach((lbl) => {
    lbl.addEventListener("click", () => {
      state.reminderSound = lbl.dataset.sound;
      storage.set({ reminderSound: state.reminderSound });
      document.querySelectorAll("[data-sound]").forEach((l) => l.classList.toggle("active", l.dataset.sound === state.reminderSound));
      syncReminders();
      if (activeAudio && !activeAudio.paused) {
        playSound(state.reminderSound);
      }
    });
  });
  const testSoundBtn = $("#testSoundBtn");
  if (testSoundBtn) {
    testSoundBtn.addEventListener("click", () => {
      if (activeAudio && !activeAudio.paused) {
        playSound("silent");
        testSoundBtn.textContent = "Test Sound";
      } else {
        testSoundBtn.textContent = "Stop Preview";
        playSound(state.reminderSound, () => {
          testSoundBtn.textContent = "Test Sound";
        });
      }
    });
  }
  syncNotificationUI();
}

function wirePrayerTap() {
  let tapTimer = null;
  document.querySelectorAll(".prayer").forEach((div) => {
    div.addEventListener("click", () => {
      const name = div.dataset.prayer;
      if (!name || !prayers) return;
      activePrayer = activePrayer === name ? null : name;
      patchPrayerDetail();
      clearTimeout(tapTimer);
      if (activePrayer) tapTimer = setTimeout(() => { activePrayer = null; patchPrayerDetail(); }, 10000);
    });
  });
}

function playSound(soundId, onEndCb) {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {}
    activeAudio = null;
  }
  if (soundId === "silent") {
    if (onEndCb) onEndCb();
    return;
  }
  const base = globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL("") : "";
  const src = base + `sounds/${soundId}.mp3`;
  try {
    activeAudio = new Audio(src);
    if (onEndCb) {
      activeAudio.addEventListener("ended", onEndCb);
      activeAudio.addEventListener("pause", onEndCb);
    }
    activeAudio.play();
  } catch (e) {
    if (onEndCb) onEndCb();
  }
}

function wireMap() {
  const mapBack = $("#mapBackBtn");
  if (mapBack) mapBack.addEventListener("click", () => update({ view: "settings" }));
  if (typeof L === "undefined") return;
  // Fix default icon paths to our local leaflet folder
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconUrl: "leaflet/marker-icon.png", iconRetinaUrl: "leaflet/marker-icon-2x.png", shadowUrl: "leaflet/marker-shadow.png" });
  const map = L.map("leafletMap").setView([state.lat, state.lng], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM" }).addTo(map);
  const marker = L.marker([state.lat, state.lng], { draggable: true }).addTo(map);
  let pendingLat = state.lat, pendingLng = state.lng;
  const labelEl = $("#mapLocLabel");
  async function updatePin(lat, lng) {
    pendingLat = lat; pendingLng = lng;
    if (labelEl) labelEl.textContent = "Fetching…";
    const name = await reverseGeocode(lat, lng);
    if (labelEl) labelEl.textContent = name;
  }
  marker.on("dragend", () => { const ll = marker.getLatLng(); updatePin(ll.lat, ll.lng); });
  map.on("click", (e) => { marker.setLatLng(e.latlng); updatePin(e.latlng.lat, e.latlng.lng); });
  // Search
  let searchTimer;
  const searchEl = $("#mapSearch");
  const resultsEl = $("#mapResults");
  if (searchEl) searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const q = searchEl.value.trim(); if (!q) { if (resultsEl) resultsEl.innerHTML = ""; return; }
      const results = await forwardGeocode(q);
      if (resultsEl) setHTML(resultsEl, results.slice(0, 5).map(r =>
        `<div class="map-result" data-lat="${r.lat}" data-lon="${r.lon}">${r.display_name}</div>`
      ).join(""));
      document.querySelectorAll(".map-result").forEach(r => r.addEventListener("click", () => {
        const lat = parseFloat(r.dataset.lat), lon = parseFloat(r.dataset.lon);
        map.setView([lat, lon], 12);
        marker.setLatLng([lat, lon]);
        updatePin(lat, lon);
        if (resultsEl) resultsEl.innerHTML = "";
        if (searchEl) searchEl.value = "";
      }));
    }, 400);
  });
  // Confirm
  const useBtn = $("#useLocationBtn");
  if (useBtn) useBtn.addEventListener("click", async () => {
    const name = await reverseGeocode(pendingLat, pendingLng);
    state.lat = +pendingLat.toFixed(4); state.lng = +pendingLng.toFixed(4);
    state.locationName = name; state.locationMethod = "map"; state.locationTab = "map";
    storage.set({ lat: state.lat, lng: state.lng, locationName: name, locationMethod: "map", locationTab: "map", prayerCache: null });
    await loadPrayers(true);
    update({ view: "settings" });
  });
}

// ---------- init ----------
(async function init() {
  const data = await storage.get();
  state = { ...DEFAULTS, ...data };

  // Removed themes fall back cleanly instead of leaving stale stored classes.
  if (!THEMES.some(([id]) => id === state.theme)) {
    state.theme = DEFAULTS.theme;
    storage.set({ theme: state.theme });
  }

  // Migrate old city/country to lat/lng
  if (!data.lat && data.city) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.city + " " + (data.country || ""))}&format=json&limit=1`);
      const j = await r.json();
      if (j[0]) {
        state.lat = +parseFloat(j[0].lat).toFixed(4);
        state.lng = +parseFloat(j[0].lon).toFixed(4);
        state.locationName = data.city + (data.country ? ", " + data.country : "");
        storage.set({ lat: state.lat, lng: state.lng, locationName: state.locationName, prayerCache: null });
      }
    } catch {}
  }

  if (globalThis.electronAPI) {
    document.body.classList.add("electron");
    globalThis.electronAPI.resizeWindow(state.popupW, state.popupH);
    globalThis.electronAPI.setAlwaysOnTop(true);
    // Listen for sound play requests from main process
    if (globalThis.electronAPI.onPlaySound) {
      globalThis.electronAPI.onPlaySound((file) => playSound(file));
    }
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        update({ popupW: window.innerWidth, popupH: window.innerHeight });
      }, 500);
    });
  }

  if (globalThis.electronAPI?.onUpdateAvailable) {
    globalThis.electronAPI.onUpdateAvailable((version, url) => {
      const now = Date.now();
      if (!state.updateAlertsEnabled || now < (state.ignoreUpdateUntil || 0)) return; // ignored by user

      let banner = document.getElementById("updateBanner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "updateBanner";
        document.body.appendChild(banner);
      }
      banner.innerHTML = `
        <div class="update-title"><span>🚀</span> Zakkir Update Available: v${version}</div>
        <div class="update-actions">
          <button id="updateDownloadBtn" class="btn-primary">Download</button>
          <button id="updateRemindBtn" class="btn-secondary">Remind Later (3d)</button>
          <button id="updateNeverBtn" class="btn-dismiss">Never Show Again</button>
        </div>
      `;
      banner.style.display = "block";

      document.getElementById("updateDownloadBtn").onclick = () => {
        globalThis.electronAPI.openExternal(url);
      };
      document.getElementById("updateRemindBtn").onclick = () => {
        banner.style.display = "none";
        state.ignoreUpdateUntil = now + 3 * 24 * 60 * 60 * 1000;
        storage.set({ ignoreUpdateUntil: state.ignoreUpdateUntil });
      };
      document.getElementById("updateNeverBtn").onclick = () => {
        banner.style.display = "none";
        state.updateAlertsEnabled = false;
        storage.set({ updateAlertsEnabled: false });
        if (state.view === "settings") render();
      };
    });
  }

  try { await loadAzkar(); } catch (e) { lastErr = "Failed to load azkar data."; }
  maybeResetDaily();
  applyAutoCategory();
  render();
  // Tell the main process the UI is ready — it will now show the window.
  // This ensures the user never sees or clicks the app before state is set up.
  if (globalThis.electronAPI?.signalReady) globalThis.electronAPI.signalReady();
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

addEventListener("pagehide", () => {
  if (countSaveTimer) storage.set({ azkarCount: state.azkarCount });
});
