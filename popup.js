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
  azkarHintDismissed: false,
  azkarResetDate: null,
  prayerCache: null,
  isElectronPinned: false,
  notificationsEnabled: true,
  remindersEnabled: false,
  reminderMinutes: 10,
  reminderMinutesByPrayer: {},
  reminderPrayers: ["Fajr","Dhuhr","Asr","Maghrib","Isha"],
  reminderSound: "adhan-1",
  prayerAlertEnabled: true,
  iqamaEnabled: false,
  iqamaMinutes: 10,
  iqamaMinutesByPrayer: {},
  ignoreUpdateUntil: 0,
  scheduleMonth: null,
  scheduleDateMode: "g",
  scheduleCache: {},
  sunnahFastHighlight: true,
  updateAlertsEnabled: true,
  prayerCollapsed: false,
  azkarNavigation: "buttons-and-swipe",
};

function migrateNotificationSettings(data) {
  if (globalThis.ZakkirNotifications?.migrateSettings) {
    return globalThis.ZakkirNotifications.migrateSettings(data);
  }
  return {
    ...data,
    remindersEnabled: data.remindersEnabled ?? data.reminderEnabled ?? DEFAULTS.remindersEnabled,
    prayerAlertEnabled: data.prayerAlertEnabled ?? data.athanEnabled ?? DEFAULTS.prayerAlertEnabled,
  };
}

// Transient (not persisted)
let focusedPrayer = null;
let countSaveTimer = null;
let azkarNavigationBusy = false;
let azkarTransitionTimer = null;
let suppressAzkarTap = false;

function persistAzkarCount(count) {
  clearTimeout(countSaveTimer);
  countSaveTimer = setTimeout(() => {
    storage.set({ azkarCount: count });
    countSaveTimer = null;
  }, 180);
}

function cancelPendingAzkarCount() {
  clearTimeout(countSaveTimer);
  countSaveTimer = null;
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
  // Monochrome System
  ["monochrome",        "Monochrome Glass"],
  ["monochrome-dark",   "Monochrome Dark Glass"],
  // Cosmic, Aurora & Oasis Ethereal Glass
  ["nebula",             "Nebula Glass Glow"],
  ["aurora",             "Northern Aurora Glass"],
  ["sahara-glass",       "Oasis Sahara Glass"],
  ["nebula-dark",        "Nebula Cosmic Dark"],
  ["aurora-dark",        "Aurora Midnight Dark"],
  ["sahara-glass-dark",  "Sahara Nocturnal Glass"],
  // macOS Professional Glassmorphic Systems
  ["macos-ventura",     "macOS Ventura Glass"],
  ["macos-sequoia",     "macOS Sequoia Mist"],
  ["macos-sonoma",      "macOS Sonoma Sunset"],
  ["crystal",           "Crystal Diamond Glass"],
  ["mist",              "Neutral Mist Glass"],
  ["midnight",          "Midnight Indigo Glass"],
  ["jade",              "Translucent Jade Glass"],
  ["slatestudio",       "Slate Pro Studio Glass"],
  ["macos-ventura-dark", "macOS Ventura Dark"],
  ["macos-sequoia-dark", "macOS Sequoia Dark"],
  ["macos-sonoma-dark",  "macOS Sonoma Dark"],
  ["crystal-dark",       "Crystal Diamond Dark"],
  ["mist-dark",          "Neutral Mist Dark"],
  ["midnight-dark",      "Midnight Indigo Dark"],
  ["jade-dark",          "Translucent Jade Dark"],
  ["slatestudio-dark",   "Slate Pro Studio Dark"],
  // Fresh picks
  ["onyx",         "Onyx"],
  ["frutiger-sunset", "Frutiger Sunset"],
  ["prism",        "Prism"],
  ["opal",         "Opal"],
  ["fajr",         "Fajr"],
  // Dark counterparts
  ["metro-dark",       "Metro Flat Dark"],
  ["material-dark",    "Material Dark"],
  ["neumorphic-dark",  "Neumorphic Dark"],
  ["aqua-dark",        "Aqua Night"],
  ["liquidglass-dark", "Liquid Glass Dark"],
  ["frutiger-dark",    "Frutiger Twilight"],
  ["editorial-dark",   "Editorial Night"],
  // Structural systems
  ["editorial", "Editorial Ink"],
  ["control",   "Control Room"],
  // New design systems
  ["swiss",       "Swiss"],
  ["scandi",      "Scandinavian"],
  ["porcelain",   "Porcelain"],
  ["terracotta",  "Terracotta"],
  ["dusk",        "Dusk"],
  ["swiss-dark",      "Swiss Dark"],
  ["scandi-dark",     "Scandinavian Dark"],
  ["porcelain-dark",  "Porcelain Dark"],
  ["terracotta-dark", "Terracotta Dark"],
  ["dusk-dark",       "Dusk Dark"],
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
  "frutiger-sunset": "frutiger",
  "editorial-dark": "editorial",
  "monochrome-dark": "monochrome",
  "nebula-dark": "nebula",
  "aurora-dark": "aurora",
  "sahara-glass-dark": "sahara-glass",
  "macos-ventura-dark": "macos-ventura",
  "macos-sequoia-dark": "macos-sequoia",
  "macos-sonoma-dark": "macos-sonoma",
  "crystal-dark": "crystal",
  "mist-dark": "mist",
  "midnight-dark": "midnight",
  "jade-dark": "jade",
  "slatestudio-dark": "slatestudio",
  "swiss-dark": "swiss",
  "scandi-dark": "scandi",
  "porcelain-dark": "porcelain",
  "terracotta-dark": "terracotta",
  "dusk-dark": "dusk",
};

// Organized Palette Categories with Orange & Peach
const PALETTES = {
  default:   { name: "Theme default" },
  // Essentials & Neutrals
  purewhite: { name: "Pure White",  a: "#ffffff" },
  pureblack: { name: "Pure Black",  a: "#0f172a" },
  pearl:     { name: "Pearl",       a: "#f5f5f4" },
  slate:     { name: "Slate",       a: "#94a3b8" },
  silver:    { name: "Silver",      a: "#cbd5e1" },
  // Orange, Coral & Peach
  orange:    { name: "Pure Orange", a: "#f97316" },
  peach:     { name: "Peach",       a: "#fed7aa" },
  coral:     { name: "Coral",       a: "#fb7185" },
  tangerine: { name: "Tangerine",   a: "#ff8c00" },
  apricot:   { name: "Apricot",     a: "#fdba74" },
  ember:     { name: "Ember",       a: "#ea580c" },
  // Warm Gold & Amber
  amber:     { name: "Amber",       a: "#fbbf24" },
  gold:      { name: "Gold",        a: "#eab308" },
  copper:    { name: "Copper",      a: "#d97706" },
  sand:      { name: "Sand",        a: "#d4a574" },
  butter:    { name: "Butter",      a: "#fde68a" },
  // Greens & Emeralds
  mint:      { name: "Mint",        a: "#6ee7b7" },
  emerald:   { name: "Emerald",     a: "#34d399" },
  forest:    { name: "Forest",      a: "#22c55e" },
  jade:      { name: "Jade",        a: "#10b981" },
  seafoam:   { name: "Seafoam",     a: "#a7f3d0" },
  // Blues & Cyans
  sky:       { name: "Sky Blue",    a: "#7dd3fc" },
  azure:     { name: "Azure Blue",  a: "#60a5fa" },
  blue:      { name: "Royal Blue",  a: "#3b82f6" },
  sapphire:  { name: "Sapphire",    a: "#2563eb" },
  indigo:    { name: "Indigo",      a: "#818cf8" },
  cyan:      { name: "Cyan",        a: "#22d3ee" },
  ocean:     { name: "Ocean",       a: "#0891b2" },
  // Purples & Pinks
  violet:    { name: "Violet",      a: "#a78bfa" },
  purple:    { name: "Purple",      a: "#c084fc" },
  plum:      { name: "Plum",        a: "#9333ea" },
  pink:      { name: "Pink",        a: "#f472b6" },
  rose:      { name: "Rose",        a: "#fb7185" },
  ruby:      { name: "Ruby Red",    a: "#e11d48" },
  lavender:  { name: "Lavender",    a: "#ddd6fe" },
};

const PALETTE_GROUPS = [
  { title: "Essentials", keys: ["default", "purewhite", "pureblack", "pearl", "slate", "silver"] },
  { title: "Orange & Peach", keys: ["orange", "peach", "coral", "tangerine", "apricot", "ember"] },
  { title: "Warm Gold", keys: ["amber", "gold", "copper", "sand", "butter"] },
  { title: "Greens", keys: ["mint", "emerald", "forest", "jade", "seafoam"] },
  { title: "Blues", keys: ["sky", "azure", "blue", "sapphire", "indigo", "cyan", "ocean"] },
  { title: "Purples & Pinks", keys: ["violet", "purple", "plum", "pink", "rose", "ruby", "lavender"] }
];

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
let renderedView = null;
let mobileNavTransition = null;
let prayerLoadSequence = 0;
let loadedPrayerDate = null;

// ---------- storage ----------
const storage = {
  get: () =>
    new Promise((res) => {
      if (globalThis.chrome?.storage) {
        chrome.storage.local.get(null, (raw) => res({ ...DEFAULTS, ...migrateNotificationSettings(raw || {}) }));
      }
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
const todayKey = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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
  cancelPendingAzkarCount();
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

function azkarOverallProgress() {
  const list = currentDhikrList();
  return { completed: list.length ? state.azkarIndex + 1 : 0, total: list.length };
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
    loadedPrayerDate = today;
    syncReminders();
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const requestId = ++prayerLoadSequence;
  try {
    const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy()}?latitude=${latR}&longitude=${lngR}&method=${state.method}`;
    const r = await fetch(url, { signal: controller.signal });
    const j = await r.json();
    if (!j?.data?.timings) throw new Error("Bad response");
    if (requestId !== prayerLoadSequence) return;
    const t = j.data.timings;
    prayers = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    loadedPrayerDate = today;
    const h = j.data.date.hijri;
    hijri = `${h.day} ${h.month.en} ${h.year} AH`;
    state.prayerCache = { date: today, lat: latR, lng: lngR, method: state.method, timings: prayers, hijri };
    storage.set({ prayerCache: state.prayerCache });
    lastErr = null;
    // send to main process for reminder scheduling
    syncReminders();
    applyAutoAzkarCategory();
  } catch (e) {
    if (requestId === prayerLoadSequence) lastErr = "Failed to load prayer times — check your location.";
  } finally {
    clearTimeout(timeout);
  }
}

function syncReminders() {
  if (globalThis.electronAPI?.setPrayerTimes && prayers) {
    globalThis.electronAPI.setPrayerTimes(prayers, {
      notificationsEnabled: state.notificationsEnabled,
      remindersEnabled: state.remindersEnabled,
      reminderMinutes: state.reminderMinutes,
      reminderMinutesByPrayer: state.reminderMinutesByPrayer,
      reminderPrayers: state.reminderPrayers,
      reminderSound: state.reminderSound,
      prayerAlertEnabled: state.prayerAlertEnabled,
      iqamaEnabled: state.iqamaEnabled,
      iqamaMinutes: state.iqamaMinutes,
      iqamaMinutesByPrayer: state.iqamaMinutesByPrayer,
      lat: state.lat,
      lng: state.lng,
      method: state.method,
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
    cancelPendingAzkarCount();
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
    cancelPendingAzkarCount();
    state.azkarResetDate = today;
    state.azkarIndex = 0;
    state.azkarCount = 0;
    storage.set({ azkarResetDate: today, azkarIndex: 0, azkarCount: 0 });
  }
  applyAutoAzkarCategory();
}

// ---------- icons ----------
const icon = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`,
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
  if (globalThis.__ZAKKIR_MOBILE__) {
    return "";
  }
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

function mobileBottomNavHTML(active) {
  if (!globalThis.__ZAKKIR_MOBILE__) return "";
  const order = ["home", "schedule", "settings"];
  const destinationIndex = Math.max(0, order.indexOf(active));
  const originIndex = mobileNavTransition?.to === destinationIndex
    ? mobileNavTransition.from
    : destinationIndex;
  return `<nav class="mobile-bottom-nav" aria-label="Primary navigation">
    <i class="mobile-nav-liquid" aria-hidden="true" style="--nav-index:${originIndex}"></i>
    <button type="button" class="mobile-bottom-nav-btn ${active === "home" ? "active" : ""}" data-go="home" aria-label="Home" ${active === "home" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.home}</span><span class="mobile-nav-label">Home</span></button>
    <button type="button" class="mobile-bottom-nav-btn ${active === "schedule" ? "active" : ""}" data-go="schedule" aria-label="Schedule" ${active === "schedule" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.cal}</span><span class="mobile-nav-label">Schedule</span></button>
    <button type="button" class="mobile-bottom-nav-btn ${active === "settings" ? "active" : ""}" data-go="settings" aria-label="Settings" ${active === "settings" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.gear}</span><span class="mobile-nav-label">Settings</span></button>
  </nav>`;
}

function prayerCardHTML() {
  const np = nextPrayer();
  const nextName = np ? np.name : (lastErr ? "Unavailable" : "Loading…");
  const countdown = np ? `${np.h}h ${String(np.m).padStart(2, "0")}m` : "—";
  return `
    <div class="prayer-collapsed-row">
      <div class="prayer-collapsed-main"><span class="eyebrow">Next prayer</span><strong>${nextName}</strong></div>
      <span class="prayer-collapsed-countdown">${countdown}</span>
      <button type="button" class="prayer-collapse" aria-label="Show prayer times" aria-expanded="false" title="Show prayer times">${icon.chevronDown}</button>
    </div>
    <div class="prayer-expanded-content">
      <div class="prayer-expanded-inner">
      <div class="prayer-hero">
        <div class="next-line">
          <span class="eyebrow">Next prayer</span>
          <div class="prayer-meta"><span class="hijri">${hijri || ""}</span>${globalThis.__ZAKKIR_MOBILE__ ? `<button type="button" class="prayer-collapse" aria-label="Minimize prayer times" aria-expanded="true" title="Minimize prayer times">${icon.chevronDown}</button>` : ""}</div>
        </div>
        <div class="next-prayer">
          <div class="next-name">${nextName}</div>
          ${np ? `<div class="next-countdown"><strong>${np.h}<small>h</small></strong><span>:</span><strong>${String(np.m).padStart(2, "0")}<small>m</small></strong></div>` : ""}
        </div>
      </div>
      ${np ? `<div class="prayer-progress" title="${np.prev} → ${np.name}"><div style="transform:scaleX(${np.pct / 100})"></div></div>` : ""}
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
      </div>
    </div>
    ${lastErr ? `<div class="err">${lastErr}</div>` : ""}`;
}

function wirePrayerCollapse() {
  // Both the collapsed-row and the expanded-content buttons render at the
  // same time (CSS shows one of them based on .is-collapsed), so bind both.
  document.querySelectorAll(".prayer-collapse").forEach((button) => {
    if (button.dataset.wired) return;
    button.dataset.wired = "1";
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      state.prayerCollapsed = !state.prayerCollapsed;
      storage.set({ prayerCollapsed: state.prayerCollapsed });
      globalThis.__ZAKKIR_HAPTIC__?.("selection");
      // Both rows are already in the DOM — a class-only toggle lets the
      // height transition animate instead of snapping via a re-render.
      document.querySelectorAll(".prayer-collapse").forEach((b) => {
        b.setAttribute("aria-expanded", String(!state.prayerCollapsed));
      });
      const region = $("#prayerRegion");
      if (region) region.classList.toggle("is-collapsed", Boolean(globalThis.__ZAKKIR_MOBILE__ && state.prayerCollapsed));
    });
  });
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
  const overall = azkarOverallProgress();
  const overallPct = overall.total ? Math.min(100, (overall.completed / overall.total) * 100) : 0;
  const reading = splitOpeningFormula(z.content);
  const morning = state.category === MORNING_CAT;
  return `
    ${globalThis.__ZAKKIR_MOBILE__ ? `<div class="azkar-context ${morning ? "is-morning" : "is-evening"}" aria-live="polite">
      <span class="azkar-context-balance" aria-hidden="true"></span>
      <div class="azkar-context-copy"><strong lang="ar">${morning ? "أذكار الصباح" : "أذكار المساء"}</strong></div>
      <span class="counter azkar-current-count" aria-label="Current dhikr progress">${state.azkarCount} / ${target}</span>
    </div>` : ""}
    ${globalThis.__ZAKKIR_MOBILE__ ? `<div class="progress azkar-current-progress" aria-hidden="true"><div style="transform:scaleX(${pct / 100})"></div></div>` : ""}
    <div class="azkar-body-wrapper">
      ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
      <div class="dhikr" lang="ar">${reading.body}</div>
      ${z.description ? `<div class="desc">${z.description}</div>` : ""}
    </div>
    <div class="azkar-progress-footer">
      ${!state.azkarHintDismissed ? `<div class="azkar-progress-label azkar-hint"><span>Tap the card to count</span></div>` : ""}
      <div class="azkar-progress-label"><span>Overall progress</span><strong class="azkar-progress-count">${overall.completed} / ${overall.total}</strong></div>
      <div class="azkar-progress-track" role="progressbar" aria-label="Overall Azkar progress" aria-valuemin="0" aria-valuemax="${overall.total}" aria-valuenow="${overall.completed}"><div style="transform:scaleX(${overallPct / 100})"></div></div>
    </div>`;
}

function navIndicatorText() {
  const list = currentDhikrList();
  return `${state.azkarIndex + 1} / ${list.length || 0}`;
}

const AZKAR_NAVIGATION_MODES = new Set(["buttons-and-swipe", "swipe-only", "buttons-only"]);
function azkarNavigationMode() {
  return AZKAR_NAVIGATION_MODES.has(state.azkarNavigation)
    ? state.azkarNavigation
    : DEFAULTS.azkarNavigation;
}

function renderHome() {
  const navMode = azkarNavigationMode();
  return `
    <div class="app home-view">
      <div class="header" id="headerRegion">${headerHTML()}</div>
      <section class="card prayer-card ${globalThis.__ZAKKIR_MOBILE__ && state.prayerCollapsed ? "is-collapsed" : ""}" id="prayerRegion" aria-label="Prayer times">${prayerCardHTML()}</section>
      ${globalThis.__ZAKKIR_MOBILE__ ? "" : `<div class="cat-row" id="catRegion">${catRowHTML()}</div>`}
      <button type="button" class="azkar-card" id="azkarTap" aria-label="Count this dhikr">${azkarCardHTML()}</button>
      <div class="nav-row azkar-controls" data-nav-mode="${navMode}">
        <button class="nav-btn" data-nav="-1" title="Previous dhikr">${icon.prev}<span>Previous</span></button>
        <button class="nav-btn reset-btn" id="resetBtn" title="Reset count" aria-label="Reset count">${icon.reset}<span>Reset</span></button>
        <button class="nav-btn" data-nav="1" title="Next dhikr"><span>Next</span>${icon.next}</button>
      </div>
      ${globalThis.__ZAKKIR_MOBILE__ ? "" : `<div class="nav-indicator" id="navIndicator" aria-live="polite">${navIndicatorText()}</div>`}
      ${mobileBottomNavHTML("home")}
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
      ${globalThis.__ZAKKIR_MOBILE__ ? "" : `<button class="sched-csv" id="schedCsv" title="Download CSV">Export CSV</button>`}
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
      ${mobileBottomNavHTML("schedule")}
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
  const locationTabs = globalThis.__ZAKKIR_MOBILE__
    ? [["gps", "GPS"], ["city", "City"]]
    : [["gps", "GPS"], ["map", "Map"], ["city", "City"]];
  const tab = locationTabs.some(([id]) => id === state.locationTab)
    ? state.locationTab
    : (method === "detect" ? "gps" : method === "map" && !globalThis.__ZAKKIR_MOBILE__ ? "map" : "city");

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
        ${locationTabs.map(([id, lbl]) => `<button type="button" class="seg-btn ${tab === id ? "active" : ""}" data-tab="${id}">${lbl}</button>`).join("")}
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

const SETTINGS_SECTIONS = globalThis.__ZAKKIR_MOBILE__
  ? ["general", "reading", "appearance", "notifications"]
  : ["general", "notifications", "reading", "appearance", "window"];
const SETTINGS_NAV = globalThis.__ZAKKIR_MOBILE__
  ? [["general", "General"], ["reading", "Reading"], ["appearance", "Appearance"], ["notifications", "Notifications"]]
  : [["general", "General"], ["notifications", "Notifications"], ["reading", "Reading"], ["appearance", "Appearance"], ["window", "Window"]];
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

function prayerMinute(map, prayer, fallback) {
  return Math.min(60, Math.max(1, Number(map?.[prayer]) || fallback));
}

function prayerTimingHTML(prayer, disabled) {
  const before = prayerMinute(state.reminderMinutesByPrayer, prayer, state.reminderMinutes);
  const after = prayerMinute(state.iqamaMinutesByPrayer, prayer, state.iqamaMinutes);
  const on = (state.reminderPrayers || []).includes(prayer);
  return `<div class="prayer-timing-row ${on ? "on" : ""}" data-prayer-timing="${prayer}"><label class="prayer-check"><input type="checkbox" data-rp="${prayer}" ${on ? "checked" : ""} ${disabled ? "disabled" : ""}/><strong>${prayer}</strong></label><label class="minute-group"><span>Before</span><span class="minute-field"><input type="number" inputmode="numeric" min="1" max="60" step="1" value="${before}" data-prayer-minutes="before" aria-label="Minutes before ${prayer}" ${disabled ? "disabled" : ""}/><small>min</small></span></label><label class="minute-group"><span>After</span><span class="minute-field"><input type="number" inputmode="numeric" min="1" max="60" step="1" value="${after}" data-prayer-minutes="after" aria-label="Minutes after ${prayer}" ${disabled ? "disabled" : ""}/><small>min</small></span></label></div>`;
}

function notificationSummary() {
  if (!state.notificationsEnabled) return "Prayer notifications are paused. Your choices are saved.";
  const prayers = (state.reminderPrayers || []).filter((prayer) => PRAYER_ORDER.includes(prayer));
  if (!prayers.length) return "Choose at least one prayer to start receiving reminders.";
  const prayerText = prayers.length === PRAYER_ORDER.length ? "all five prayers" : prayers.join(", ");
  const events = [];
  if (state.remindersEnabled) events.push("before athan");
  if (state.prayerAlertEnabled) events.push("at athan");
  if (state.iqamaEnabled) events.push("after athan");
  if (!events.length) return "Choose when you want to be notified.";
  return `You will be notified ${events.join(", ")} for ${prayerText}.`;
}

function syncNotificationUI() {
  const enabled = state.notificationsEnabled;
  const config = document.querySelector(".notification-config");
  config?.classList.toggle("is-paused", !enabled);
  const master = $("#notificationsEnabled");
  if (master) master.checked = enabled;
  const athan = $("#prayerAlertEnabled");
  if (athan) { athan.checked = !!state.prayerAlertEnabled; athan.disabled = !enabled; }
  const reminders = $("#remindersEnabled");
  if (reminders) { reminders.checked = !!state.remindersEnabled; reminders.disabled = !enabled; }
  const iqama = $("#iqamaEnabled");
  if (iqama) { iqama.checked = !!state.iqamaEnabled; iqama.disabled = !enabled; }
  document.querySelectorAll("[data-rp]").forEach((input) => {
    const active = (state.reminderPrayers || []).includes(input.dataset.rp);
    input.checked = active;
    input.disabled = !enabled;
    input.closest("[data-prayer-timing]")?.classList.toggle("on", active);
  });
  document.querySelectorAll("[data-prayer-minutes]").forEach((input) => { input.disabled = !enabled; });
  document.querySelectorAll("[data-prayer-action]").forEach((button) => { button.disabled = !enabled; });
  const summary = document.querySelector(".notification-confirmation p");
  if (summary) summary.textContent = notificationSummary();
  document.querySelector(".notification-confirmation")?.classList.toggle("paused", !enabled);
}

const SOUNDS = [
  ["adhan-1", "Adhan 1"],
  ["adhan-2", "Adhan 2"],
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
      ${globalThis.electronAPI && !globalThis.__ZAKKIR_MOBILE__ ? `<div class="row"><label>Show update alerts</label><label class="switch"><input type="checkbox" id="updateAlertsEnabled" ${state.updateAlertsEnabled ? "checked" : ""}/><span></span></label></div>` : ""}
    </div>`;
  if (id === "notifications") {
    const notificationsOff = !state.notificationsEnabled;
    return `
    <div class="notification-master settings-card"><div><strong>Prayer notifications</strong><span>Receive timely reminders around each prayer.</span></div><label class="switch" aria-label="Prayer notifications"><input type="checkbox" id="notificationsEnabled" ${state.notificationsEnabled ? "checked" : ""}/><span></span></label></div>
    <div class="notification-config ${notificationsOff ? "is-paused" : ""}" aria-disabled="${notificationsOff}">
      <div class="notification-block settings-card"><div class="notification-block-head"><div><span class="notification-kicker">When to notify</span><strong>Prayer reminders</strong></div></div>
        <div class="athan-line"><div class="athan-copy"><strong>Before athan</strong><span>Prepare for the prayer ahead of time.</span></div><label class="switch" aria-label="Notify before athan"><input type="checkbox" id="remindersEnabled" ${state.remindersEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        <div class="athan-line"><div class="athan-copy"><strong>At athan</strong><span>Notify when the exact prayer time begins.</span></div><label class="switch" aria-label="Notify at athan"><input type="checkbox" id="prayerAlertEnabled" ${state.prayerAlertEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        <div class="athan-line"><div class="athan-copy"><strong>After athan</strong><span>Remind me when it is time for iqama.</span></div><label class="switch" aria-label="Notify for iqama"><input type="checkbox" id="iqamaEnabled" ${state.iqamaEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        <div class="prayer-timing-list">${PRAYER_ORDER.map((p) => prayerTimingHTML(p, notificationsOff)).join("")}</div>
      </div>
      <div class="settings-card"><div class="settings-card-title">Reminder sound</div><div class="sound-grid">${SOUNDS.map(([id, label]) => `<label class="sound-option ${state.reminderSound === id ? "active" : ""}" data-sound="${id}"><input type="radio" name="reminderSound" value="${id}" ${state.reminderSound === id ? "checked" : ""} style="display:none">${label}</label>`).join("")}</div><div class="sound-actions"><button class="loc-btn" id="testSoundBtn">Test Sound</button></div></div>
    </div>
    <div class="notification-confirmation ${state.notificationsEnabled ? "" : "paused"}"><span class="confirmation-dot"></span><p>${notificationSummary()}</p></div>`;
  }
  if (id === "reading") return `<div class="settings-card"><div class="font-grid">${Object.keys(FONT_MAP).map((f) => `<button class="pill ${state.font === f ? "active" : ""}" data-font="${f}" aria-label="${f}"><span class="font-sample">أبجد</span><span>${f}</span></button>`).join("")}</div><div class="row"><label>Arabic size</label><input type="range" min="0.7" max="2" step="0.05" value="${state.arSize}" id="arSize"/><span>${state.arSize.toFixed(2)}×</span></div>${globalThis.__ZAKKIR_MOBILE__ ? `<div class="row"><label>App scale</label><div class="zoom-row"><button class="zoom-btn" data-zoom="-0.1">−</button><span class="zoom-val">${Math.round(state.zoom * 100)}%</span><button class="zoom-btn" data-zoom="0.1">+</button></div></div><div class="row azkar-navigation-setting"><label>Azkar navigation</label><div class="seg" role="group" aria-label="Azkar navigation mode"><button class="seg-btn ${azkarNavigationMode() === "buttons-and-swipe" ? "active" : ""}" data-azkar-navigation="buttons-and-swipe">Buttons + swipe</button><button class="seg-btn ${azkarNavigationMode() === "swipe-only" ? "active" : ""}" data-azkar-navigation="swipe-only">Swipe only</button><button class="seg-btn ${azkarNavigationMode() === "buttons-only" ? "active" : ""}" data-azkar-navigation="buttons-only">Buttons only</button></div></div>` : ""}<div class="preview">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></div>`;
  if (id === "appearance") {
    const designEras = THEMES.filter(([tid]) => ["metro", "material", "neumorphic"].includes(tid));
    const glassThemes = THEMES.filter(([tid]) => [
      "aqua", "liquidglass", "frutiger", "monochrome", "monochrome-dark",
      "nebula", "aurora", "sahara-glass", "nebula-dark", "aurora-dark", "sahara-glass-dark",
      "macos-ventura", "macos-sequoia", "macos-sonoma", "crystal", "mist", "midnight", "jade", "slatestudio",
      "macos-ventura-dark", "macos-sequoia-dark", "macos-sonoma-dark", "crystal-dark", "mist-dark", "midnight-dark", "jade-dark", "slatestudio-dark"
    ].includes(tid));
    const boldThemes = THEMES.filter(([tid]) => ["neobrutal"].includes(tid));
    const freshPicks = THEMES.filter(([tid]) => ["onyx", "frutiger-sunset", "prism", "opal", "fajr"].includes(tid));
    const classicIndex = THEMES.findIndex(([tid]) => tid === "light");
    const atmosphericThemes = THEMES.slice(0, classicIndex).filter(([tid]) => {
      return ![
        "metro", "material", "neumorphic", "aqua", "liquidglass", "frutiger", "monochrome", "monochrome-dark",
        "nebula", "aurora", "sahara-glass", "nebula-dark", "aurora-dark", "sahara-glass-dark",
        "macos-ventura", "macos-sequoia", "macos-sonoma", "crystal", "mist", "midnight", "jade", "slatestudio",
        "macos-ventura-dark", "macos-sequoia-dark", "macos-sonoma-dark", "crystal-dark", "mist-dark", "midnight-dark", "jade-dark", "slatestudio-dark",
        "neobrutal", "onyx", "frutiger-sunset", "prism", "opal", "fajr"
      ].includes(tid);
    });
    const classicThemes = THEMES.slice(classicIndex);

    return `<div class="settings-card">
      <div class="theme-intro">Choose a complete visual system. Themes can change geometry, depth, texture, motion, and color. The accent palette remains customizable.</div>
      <div class="theme-collection-title"><span>Design eras</span><span>${designEras.length}</span></div>
      <div class="theme-grid theme-grid-featured">${themeCardsHTML(designEras, true)}</div>
      
      <div class="theme-collection-title classic-title"><span>Glass and depth</span><span>${glassThemes.length}</span></div>
      <div class="theme-grid theme-grid-featured">${themeCardsHTML(glassThemes, true)}</div>
      
      <div class="theme-collection-title classic-title"><span>Bold and experimental</span><span>${boldThemes.length}</span></div>
      <div class="theme-grid theme-grid-featured">${themeCardsHTML(boldThemes, true)}</div>
      
      <div class="theme-collection-title classic-title"><span>Fresh picks</span><span>${freshPicks.length}</span></div>
      <div class="theme-grid theme-grid-featured">${themeCardsHTML(freshPicks, true)}</div>
      
      ${state.theme === "neobrutal" ? `<div class="neobrutal-tone">${neobrutalToneHTML()}</div>` : ""}
      
      <div class="theme-collection-title classic-title"><span>Atmospheric themes</span><span>${atmosphericThemes.length}</span></div>
      <div class="theme-grid">${themeCardsHTML(atmosphericThemes)}</div>
      
      <details class="settings-advanced">
        <summary>Browse classic themes (${classicThemes.length})</summary>
        <div class="theme-grid">${themeCardsHTML(classicThemes)}</div>
      </details>
    </div>
    <div class="settings-card">
      <div class="settings-card-title">Accent color</div>
      ${PALETTE_GROUPS.map(g => `
        <div class="palette-group">
          <div class="palette-group-title">${g.title}</div>
          <div class="palette-grid">
            ${g.keys.map(k => {
              const p = PALETTES[k];
              if (!p) return "";
              return `<button class="palette-chip ${state.palette === k ? "active" : ""}" data-palette="${k}" title="${p.name}" style="background:${p.a || "transparent"};${!p.a ? "background:repeating-linear-gradient(45deg,var(--surface-2) 0 4px,var(--line) 4px 8px);" : ""}"></button>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>`;
  }
  if (id === "window") return `<div class="settings-card"><div class="row"><label>UI zoom</label><div class="zoom-row"><button class="zoom-btn" data-zoom="-0.1">−</button><span class="zoom-val">${Math.round(state.zoom * 100)}%</span><button class="zoom-btn" data-zoom="0.1">+</button></div></div><div class="row"><label>Width</label><input type="range" min="360" max="900" step="10" value="${state.popupW}" id="popupW"/><span>${state.popupW}px</span></div><div class="row"><label>Height</label><input type="range" min="480" max="900" step="10" value="${state.popupH}" id="popupH"/><span>${state.popupH}px</span></div></div>`;
  return "";
}
function buildSettingsSection(id) {
  const [title, description] = SETTINGS_META[id];
  return settingsSectionHTML(id, title, description, settingsBodyHTML(id));
}
function renderSettings() {
  const active = SETTINGS_SECTIONS.includes(state.settingsSection) ? state.settingsSection : "general";
  return `<div class="app settings-view"><div class="settings-head"><button class="icon-btn" data-go="home">${icon.back}</button><h1>Settings</h1><span style="width:30px"></span></div><nav class="settings-nav" aria-label="Settings sections">${SETTINGS_NAV.map(([id, label]) => `<button type="button" class="settings-nav-btn ${active === id ? "active" : ""}" data-settings-section="${id}">${label}</button>`).join("")}</nav>${buildSettingsSection(active)}${mobileBottomNavHTML("settings")}</div>`;
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

let _appliedStateCache = {};

function applyVars() {
  const validThemes = THEMES.map(([id]) => id);
  const theme = validThemes.includes(state.theme) ? state.theme : DEFAULTS.theme;
  const palette = state.palette;
  const contrast = state.neobrutalContrast;

  if (_appliedStateCache.theme !== theme || _appliedStateCache.contrast !== contrast) {
    for (const id of validThemes) {
      document.documentElement.classList.remove("theme-" + id);
      if (THEME_BASES[id]) document.documentElement.classList.remove("theme-" + THEME_BASES[id]);
    }
    document.documentElement.classList.add("theme-" + theme);
    if (THEME_BASES[theme]) document.documentElement.classList.add("theme-" + THEME_BASES[theme]);
    document.documentElement.classList.toggle("neobrutal-high", contrast === "high");
    _appliedStateCache.theme = theme;
    _appliedStateCache.contrast = contrast;
  }

  const font = FONT_MAP[state.font] ? state.font : "Scheherazade";
  document.body.style.setProperty("--ar-font", FONT_MAP[font]);
  document.body.style.setProperty("--ar-size", state.arSize);
  document.body.style.setProperty("--zoom", state.zoom);
  document.body.style.setProperty("--popup-w", state.popupW + "px");
  document.body.style.setProperty("--popup-h", state.popupH + "px");

  const pinned = globalThis.electronAPI ? true : IS_PINNED;
  document.body.classList.toggle("pinned", pinned);

  if (_appliedStateCache.palette !== palette) {
    document.body.style.removeProperty("--accent");
    document.body.style.removeProperty("--accent-ink");
    const p = PALETTES[palette];
    if (p && p.a) {
      document.body.style.setProperty("--accent", p.a);
      document.body.style.setProperty("--accent-ink", contrastInk(p.a));
    }
    _appliedStateCache.palette = palette;
  }

  if (globalThis.__ZAKKIR_MOBILE__ && (_appliedStateCache.postedTheme !== theme || _appliedStateCache.postedPalette !== palette)) {
    _appliedStateCache.postedTheme = theme;
    _appliedStateCache.postedPalette = palette;
    setTimeout(() => {
      try {
        const cs = getComputedStyle(document.documentElement);
        const bg = cs.getPropertyValue("--bg").trim() || "#f4f4f6";
        const probe = document.createElement("span");
        probe.style.color = bg;
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) || [244, 244, 246];
        probe.remove();
        const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
        const isDark = luminance < 0.5;
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "theme-color", bg, isDark }));
      } catch (_) {}
    }, 20);
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
  const previousView = renderedView;
  const paint = () => {
    if (state.view === "map") {
      setHTML(app, renderMap());
      wireMap();
    } else {
      const html = state.view === "settings" ? renderSettings()
        : state.view === "schedule" ? renderSchedule()
        : renderHome();
      setHTML(app, html);
      wire();
      settleMobileNav(state.view);
    }
  };
  const viewChanged = renderedView !== null && renderedView !== state.view;
  renderedView = state.view;
  paint();
  if (globalThis.__ZAKKIR_MOBILE__) {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "view-change", view: state.view }));
  }
}

globalThis.__ZAKKIR_HANDLE_BACK__ = () => {
  if (state.view === "home") return false;
  update({ view: state.view === "map" ? "settings" : "home" });
  return true;
};

function settleMobileNav(nextView) {
  if (!globalThis.__ZAKKIR_MOBILE__) return;
  const nav = document.querySelector(".mobile-bottom-nav");
  if (!nav) return;
  const order = ["home", "schedule", "settings"];
  const to = order.indexOf(nextView);
  if (to < 0) return;
  const liquid = nav.querySelector(".mobile-nav-liquid");
  if (!liquid) return;
  requestAnimationFrame(() => {
    liquid.style.setProperty("--nav-index", String(to));
    mobileNavTransition = null;
  });
}

function patchCount(count, target) {
  const categoryCounter = document.querySelector("#catRegion .counter");
  if (categoryCounter) categoryCounter.textContent = `${count} / ${target}`;
  const currentCounter = document.querySelector("#azkarTap .azkar-current-count");
  if (currentCounter) currentCounter.textContent = `${count} / ${target}`;
  const currentBar = document.querySelector("#azkarTap .azkar-current-progress > div");
  if (currentBar) currentBar.style.transform = `scaleX(${Math.min(1, count / target)})`;
  const overall = azkarOverallProgress();
  const overallProgress = document.querySelector("#azkarTap .azkar-progress-track");
  if (overallProgress) overallProgress.setAttribute("aria-valuenow", String(overall.completed));
  const overallBar = document.querySelector("#azkarTap .azkar-progress-track > div");
  if (overallBar) overallBar.style.transform = `scaleX(${overall.total ? Math.min(1, overall.completed / overall.total) : 0})`;
  const overallCounter = document.querySelector("#azkarTap .azkar-progress-count");
  if (overallCounter) overallCounter.textContent = `${overall.completed} / ${overall.total}`;
  const hint = document.querySelector("#azkarTap .azkar-hint");
  if (hint && state.azkarHintDismissed) hint.remove();
}

function patchAzkarCard() {
  const el = $("#azkarTap");
  if (el) {
    const list = currentDhikrList();
    const z = list[state.azkarIndex] || { content: "—", count: "1", description: "" };
    const target = parseInt(z.count, 10) || 1;
    const bodyWrapper = el.querySelector(".azkar-body-wrapper");

    if (bodyWrapper) {
      const reading = splitOpeningFormula(z.content);
      const morning = state.category === MORNING_CAT;
      const contextCopy = el.querySelector(".azkar-context-copy strong");
      if (contextCopy) contextCopy.textContent = morning ? "أذكار الصباح" : "أذكار المساء";

      bodyWrapper.innerHTML = `
        ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
        <div class="dhikr" lang="ar">${reading.body}</div>
        ${z.description ? `<div class="desc">${z.description}</div>` : ""}`;

      patchCount(state.azkarCount, target);
    } else {
      setHTML(el, azkarCardHTML());
    }
  }

  const cat = $("#catRegion");
  if (cat && !globalThis.__ZAKKIR_MOBILE__) {
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

function animateAzkarSwap(direction, paint, fromSwipe = false) {
  const el = $("#azkarTap");
  if (!el || !globalThis.__ZAKKIR_MOBILE__) {
    paint();
    return;
  }
  if (azkarNavigationBusy) return;
  azkarNavigationBusy = true;
  if (azkarTransitionTimer) clearTimeout(azkarTransitionTimer);

  const startHeight = el.getBoundingClientRect().height;
  el.style.height = `${startHeight}px`;

  const innerContent = el.querySelector(".azkar-body-wrapper") || el.querySelector(".dhikr") || el;

  if (!fromSwipe) {
    innerContent.style.transition = "transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease";
    innerContent.style.transform = `translateX(${direction > 0 ? -50 : 50}px)`;
    innerContent.style.opacity = "0.2";
  }

  window.setTimeout(() => {
    paint();
    const newEl = $("#azkarTap");
    if (!newEl) {
      azkarNavigationBusy = false;
      return;
    }
    newEl.style.height = "auto";
    const nextHeight = newEl.getBoundingClientRect().height;
    newEl.style.height = `${startHeight}px`;

    const newInner = newEl.querySelector(".azkar-body-wrapper") || newEl.querySelector(".dhikr") || newEl;
    newInner.style.transition = "none";
    newInner.style.transform = `translateX(${direction > 0 ? 40 : -40}px)`;
    newInner.style.opacity = "0.2";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newInner.style.transition = "transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.2s ease";
        newInner.style.transform = "translateX(0)";
        newInner.style.opacity = "1";
        newEl.style.transition = "height 0.2s cubic-bezier(0.22, 1, 0.36, 1)";
        newEl.style.height = `${nextHeight}px`;
      });
    });

    azkarTransitionTimer = window.setTimeout(() => {
      newEl.style.transition = "";
      newEl.style.height = "";
      if (newInner) {
        newInner.style.transition = "";
        newInner.style.transform = "";
        newInner.style.opacity = "";
      }
      azkarNavigationBusy = false;
      azkarTransitionTimer = null;
    }, 230);
  }, fromSwipe ? 10 : 110);
}

function navigateAzkar(direction, fromSwipe = false) {
  const list = currentDhikrList();
  if (!list.length || azkarNavigationBusy) return;
  const index = (state.azkarIndex + direction + list.length) % list.length;
  cancelPendingAzkarCount();
  state.azkarIndex = index;
  state.azkarCount = 0;
  storage.set({ azkarIndex: index, azkarCount: 0 });
  animateAzkarSwap(direction, patchAzkarCard, fromSwipe);
}

function wireAzkarSwipe(tap) {
  if (!tap || !globalThis.__ZAKKIR_MOBILE__ || azkarNavigationMode() === "buttons-only") return;
  let startX = 0;
  let startY = 0;
  let currentDx = 0;
  let tracking = false;
  let isHorizontal = false;

  tap.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || azkarNavigationBusy) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    currentDx = 0;
    tracking = true;
    isHorizontal = false;
  }, { passive: true });

  tap.addEventListener("touchmove", (event) => {
    if (!tracking || !event.touches.length) return;
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const dx = touchX - startX;
    const dy = touchY - startY;

    if (!isHorizontal) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        isHorizontal = true;
      } else if (Math.abs(dy) > 12) {
        tracking = false;
        return;
      }
    }

    if (isHorizontal) {
      currentDx = dx;
      const inner = tap.querySelector(".azkar-body-wrapper") || tap.querySelector(".dhikr") || tap;
      inner.style.transition = "none";
      const dampedDx = dx * 0.72;
      inner.style.transform = `translateX(${dampedDx}px)`;
      inner.style.opacity = `${Math.max(0.55, 1 - Math.abs(dx) / 360)}`;
    }
  }, { passive: true });

  tap.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;
    const inner = tap.querySelector(".azkar-body-wrapper") || tap.querySelector(".dhikr") || tap;

    if (isHorizontal && Math.abs(currentDx) >= 38) {
      suppressAzkarTap = true;
      window.setTimeout(() => { suppressAzkarTap = false; }, 300);
      globalThis.__ZAKKIR_HAPTIC__?.("selection");

      const direction = currentDx < 0 ? 1 : -1;
      inner.style.transition = "transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease";
      inner.style.transform = `translateX(${currentDx < 0 ? -90 : 90}px)`;
      inner.style.opacity = "0.2";

      window.setTimeout(() => {
        navigateAzkar(direction, true);
      }, 90);
    } else {
      inner.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.2s ease";
      inner.style.transform = "translateX(0)";
      inner.style.opacity = "1";
    }
  }, { passive: true });
}

function patchPrayerCard(forceRebuild = false) {
  const el = $("#prayerRegion");
  if (!el) return;
  el.classList.toggle("is-collapsed", Boolean(globalThis.__ZAKKIR_MOBILE__ && state.prayerCollapsed));

  const np = nextPrayer();
  const nextName = np ? np.name : (lastErr ? "Unavailable" : "Loading…");
  const currentNameEl = el.querySelector(".next-name") || el.querySelector(".prayer-collapsed-main strong");

  // If forceRebuild is true, or structure/prayer changed, re-render HTML cleanly
  if (forceRebuild || !currentNameEl || currentNameEl.textContent.trim() !== nextName) {
    setHTML(el, prayerCardHTML());
    wirePrayerTap();
    wirePrayerCollapse();
    return;
  }

  // In-place patch: update countdown text and progress bar fill
  if (np) {
    const countdownCollapsed = el.querySelector(".prayer-collapsed-countdown");
    if (countdownCollapsed) countdownCollapsed.textContent = `${np.h}h ${String(np.m).padStart(2, "0")}m`;

    const countdownHeroHours = el.querySelector(".next-countdown strong:first-child");
    const countdownHeroMins = el.querySelector(".next-countdown strong:last-child");
    if (countdownHeroHours && countdownHeroMins) {
      countdownHeroHours.innerHTML = `${np.h}<small>h</small>`;
      countdownHeroMins.innerHTML = `${String(np.m).padStart(2, "0")}<small>m</small>`;
    }

    const progress = el.querySelector(".prayer-progress > div");
    if (progress) progress.style.transform = `scaleX(${np.pct / 100})`;
  }
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
  if (keys.length && keys.every((k) => VAR_ONLY_KEYS.has(k))) { applyVars(); return; }
  // View changes always re-render — the settings branch below must not
  // swallow navigation (state.view already reflects the target view here).
  if (keys.includes("view")) { render(); return; }
  if (state.view === "settings") {
    for (const [k, v] of Object.entries(patch)) {
      if (k === "azkarNavigation") patchSettingsActive("data-azkar-navigation", v);
    }
    return;
  }
  if (keys.length && keys.every((k) => AZKAR_ONLY_KEYS.has(k))) { patchAzkarCard(); return; }
  render();
}

function wire() {
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.view !== b.dataset.go) {
        const order = ["home", "schedule", "settings"];
        const from = order.indexOf(state.view);
        const to = order.indexOf(b.dataset.go);
        mobileNavTransition = from >= 0 && to >= 0 && from !== to ? { from, to } : null;
        globalThis.__ZAKKIR_HAPTIC__?.("selection");
        update({ view: b.dataset.go });
      }
    })
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
  wirePrayerCollapse();
  const tap = $("#azkarTap");
  wireAzkarSwipe(tap);
  if (tap) tap.addEventListener("click", () => {
    if (suppressAzkarTap || azkarNavigationBusy) return;
    const list = currentDhikrList();
    const z = list[state.azkarIndex]; if (!z) return;
    const target = parseInt(z.count, 10) || 1;
    const next = state.azkarCount + 1;
    if (globalThis.__ZAKKIR_MOBILE__ && !state.azkarHintDismissed) {
      state.azkarHintDismissed = true;
      storage.set({ azkarHintDismissed: true });
    }
    tap.classList.remove("pulse");
    void tap.offsetWidth;
    tap.classList.add("pulse");
    setTimeout(() => tap.classList.remove("pulse"), 220);
    globalThis.__ZAKKIR_HAPTIC__?.(next >= target ? "success" : "light");
    if (next >= target) {
      // Finish in place, then advance through the same animated path as navigation.
      state.azkarCount = target;
      patchCount(target, target);
      tap.classList.remove("azkar-complete");
      void tap.offsetWidth;
      tap.classList.add("azkar-complete");
      setTimeout(() => tap.classList.remove("azkar-complete"), 500);
      setTimeout(() => navigateAzkar(1), 420);
    } else {
      // in-place patch: no full re-render, no flicker
      state.azkarCount = next;
      persistAzkarCount(next);
      patchCount(next, target);
    }
  });
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      const dir = parseInt(b.dataset.nav, 10);
      navigateAzkar(dir);
    })
  );
  const reset = $("#resetBtn");
  if (reset) reset.addEventListener("click", () => {
    const list = currentDhikrList();
    const z = list[state.azkarIndex];
    const target = z ? (parseInt(z.count, 10) || 1) : 1;
    cancelPendingAzkarCount();
    state.azkarCount = 0;
    storage.set({ azkarCount: 0 });
    globalThis.__ZAKKIR_HAPTIC__?.("selection");
    patchCount(0, target);
  });
  // Themed dropdowns (replaces native <select>)
  if (!globalThis.__ZAKKIR_MOBILE__) {
    wireDropdowns({
      catPick: (v) => {
        state.autoTime = false;
        storage.set({ autoTime: false });
        update({ category: v, azkarIndex: 0, azkarCount: 0 });
      },
    });
  }
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
    monochrome:          { bg: "linear-gradient(180deg,#f8fafc,#edf2f7)", a: "#0f172a", style: "monochrome" },
    "monochrome-dark":   { bg: "linear-gradient(180deg,#090a0d,#050507)", a: "#ffffff", style: "monochrome" },
    nebula:              { bg: "linear-gradient(135deg,#fff1f2,#e0e7ff)", a: "#6366f1", style: "nebula" },
    aurora:              { bg: "linear-gradient(180deg,#ebfbf5,#d1fae5)", a: "#0d9488", style: "aurora" },
    "sahara-glass":      { bg: "linear-gradient(180deg,#fef7e0,#e0f2fe)", a: "#0ea5e9", style: "sahara-glass" },
    "nebula-dark":       { bg: "linear-gradient(180deg,#0c0814,#040306)", a: "#db2777", style: "nebula" },
    "aurora-dark":       { bg: "linear-gradient(180deg,#090e0c,#040605)", a: "#10b981", style: "aurora" },
    "sahara-glass-dark": { bg: "linear-gradient(180deg,#100b08,#060403)", a: "#f97316", style: "sahara-glass" },
    "macos-ventura":     { bg: "linear-gradient(180deg,#e8ecf2,#d8e0ec)", a: "#0066cc", style: "macos-ventura" },
    "macos-sequoia":     { bg: "linear-gradient(180deg,#e5ece9,#d5e2dc)", a: "#059669", style: "macos-sequoia" },
    "macos-sonoma":      { bg: "linear-gradient(180deg,#efe8f0,#dfd4e4)", a: "#7c3aed", style: "macos-sonoma" },
    crystal:             { bg: "linear-gradient(135deg,#eef2f7,#e2e8f0)", a: "#2563eb", style: "crystal" },
    mist:                { bg: "linear-gradient(180deg,#eceef1,#dedfe4)", a: "#4b5563", style: "mist" },
    midnight:            { bg: "linear-gradient(180deg,#e2e6f0,#d4daf0)", a: "#1d4ed8", style: "midnight" },
    jade:                { bg: "linear-gradient(180deg,#e8f0ec,#d6e6dc)", a: "#15803d", style: "jade" },
    slatestudio:         { bg: "linear-gradient(180deg,#e5e7eb,#d8dce4)", a: "#0284c7", style: "slatestudio" },
    "macos-ventura-dark": { bg: "linear-gradient(180deg,#181a20,#101216)", a: "#3388ff", style: "macos-ventura" },
    "macos-sequoia-dark": { bg: "linear-gradient(180deg,#141c19,#0d1210)", a: "#10b981", style: "macos-sequoia" },
    "macos-sonoma-dark":  { bg: "linear-gradient(180deg,#1a141c,#100b12)", a: "#a78bfa", style: "macos-sonoma" },
    "crystal-dark":       { bg: "linear-gradient(135deg,#0f1523,#070912)", a: "#6366f1", style: "crystal" },
    "mist-dark":          { bg: "linear-gradient(180deg,#16181c,#0f1013)", a: "#9ca3af", style: "mist" },
    "midnight-dark":      { bg: "linear-gradient(180deg,#0d0f17,#05060b)", a: "#3b82f6", style: "midnight" },
    "jade-dark":          { bg: "linear-gradient(180deg,#0e1a13,#060e09)", a: "#22c55e", style: "jade" },
    "slatestudio-dark":   { bg: "linear-gradient(180deg,#131b2c,#0b0f19)", a: "#38bdf8", style: "slatestudio" },
    "metro-dark":       { bg: "#151719", a: "#69aa98", style: "metro" },
    "material-dark":    { bg: "#17181d", a: "#b5a3d4", style: "material" },
    "neumorphic-dark":  { bg: "#222a2e", a: "#78ad9e", style: "neumorphic" },
    "aqua-dark":        { bg: "linear-gradient(180deg,#183139,#0c1c22)", a: "#79b7a9", style: "aqua" },
    "liquidglass-dark": { bg: "linear-gradient(135deg,#18211f,#29322f 48%,#111817)", a: "#8bb6a8", style: "liquidglass" },
    "frutiger-dark":    { bg: "linear-gradient(180deg,#243b42 0 48%,#1d3028 49%)", a: "#91b69b", style: "frutiger" },
    "editorial-dark":   { bg: "#1d1b19", a: "#c9826c", style: "editorial" },
    onyx:       { bg: "#0b0b0d", a: "#e8e2d4", style: "onyx" },
    "frutiger-sunset": { bg: "linear-gradient(180deg,#ffd9c4 0 46%,#8fc4b6 47% 58%,#5fa392 59%)", a: "#d9776f", style: "sunset" },
    prism:      { bg: "linear-gradient(145deg,#eef2f6,#e7eaf1 55%,#ece9f2)", a: "#7f8fd0", style: "prism" },
    opal:       { bg: "linear-gradient(135deg,#f2f5f8,#dfe5ec 55%,#e8e6ee)", a: "#6f7f92", style: "opal" },
    fajr:       { bg: "linear-gradient(180deg,#ffe8dc 0%,#f9dbe0 46%,#e6dcf0 78%,#dcd4ea)", a: "#c97f8f", style: "fajr" },
    editorial:  { bg: "#f3efe6", a: "#b53824", style: "editorial" },
    control:    { bg: "#15191c", a: "#d8f34a", style: "control" },
    swiss:      { bg: "#f8f8f8", a: "#d92b2b", style: "swiss" },
    scandi:     { bg: "#f5f1ec", a: "#5a7a62", style: "scandi" },
    porcelain:  { bg: "#f7f9fc", a: "#2855a0", style: "porcelain" },
    terracotta: { bg: "#ece4d9", a: "#b35c2a", style: "terracotta" },
    dusk:       { bg: "linear-gradient(165deg,#f5ece2,#efe4dd 45%,#e8dde6)", a: "#b8862a", style: "dusk" },
    "swiss-dark":      { bg: "#111113", a: "#e85454", style: "swiss" },
    "scandi-dark":     { bg: "#1a1816", a: "#7da67f", style: "scandi" },
    "porcelain-dark":  { bg: "#0e1117", a: "#5b8fd4", style: "porcelain" },
    "terracotta-dark": { bg: "#1c1614", a: "#d4845a", style: "terracotta" },
    "dusk-dark":       { bg: "linear-gradient(165deg,#181420,#1a1525 45%,#18121e)", a: "#e8b84d", style: "dusk" },
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
  document.querySelectorAll("[data-azkar-navigation]").forEach((b) =>
    b.addEventListener("click", () => update({ azkarNavigation: b.dataset.azkarNavigation }))
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
  const ae = $("#prayerAlertEnabled");
  if (ae) ae.addEventListener("change", (e) => {
    state.prayerAlertEnabled = e.target.checked;
    storage.set({ prayerAlertEnabled: state.prayerAlertEnabled });
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
  const ie = $("#iqamaEnabled");
  if (ie) ie.addEventListener("change", (e) => {
    state.iqamaEnabled = e.target.checked;
    storage.set({ iqamaEnabled: state.iqamaEnabled });
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
  document.querySelectorAll("[data-prayer-minutes]").forEach((input) => {
    input.addEventListener("input", () => {
      const minutes = Math.min(60, Math.max(1, parseInt(input.value, 10) || 1));
      const prayer = input.closest("[data-prayer-timing]")?.dataset.prayerTiming;
      if (!prayer) return;
      const key = input.dataset.prayerMinutes === "before" ? "reminderMinutesByPrayer" : "iqamaMinutesByPrayer";
      state[key] = { ...state[key], [prayer]: minutes };
    });
    input.addEventListener("change", () => {
      input.value = String(Math.min(60, Math.max(1, parseInt(input.value, 10) || 1)));
      const key = input.dataset.prayerMinutes === "before" ? "reminderMinutesByPrayer" : "iqamaMinutesByPrayer";
      storage.set({ [key]: state[key] });
      syncReminders();
    });
  });
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
  const src = globalThis.__ZAKKIR_SOUNDS__?.[soundId] || (base + `sounds/${soundId}.mp3`);
  try {
    activeAudio = new Audio(src);
    if (onEndCb) {
      activeAudio.addEventListener("ended", onEndCb);
      activeAudio.addEventListener("pause", onEndCb);
    }
    const promise = activeAudio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn("Audio playback error:", err);
        if (onEndCb) onEndCb();
      });
    }
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
  const migratedData = migrateNotificationSettings(data);
  state = { ...DEFAULTS, ...migratedData };
  if (data.reminderEnabled !== undefined || data.athanEnabled !== undefined) {
    storage.set({
      remindersEnabled: state.remindersEnabled,
      prayerAlertEnabled: state.prayerAlertEnabled,
      reminderEnabled: null,
      athanEnabled: null,
    });
    if (globalThis.chrome?.storage) chrome.storage.local.remove(["reminderEnabled", "athanEnabled"]);
  }

  // Mobile always starts in time-based mode. A manual category choice can
  // still override the category for the current session, but should not
  // permanently prevent the next launch from opening Morning or Evening.
  if (globalThis.__ZAKKIR_MOBILE__) {
    state.autoTime = true;
    storage.set({ autoTime: true });
  }

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
  setInterval(async () => {
    if (!prayers || loadedPrayerDate !== todayKey()) await loadPrayers(true);
    if (state.view !== "home") return;
    patchPrayerCard();
    if (applyAutoCategory()) patchAzkarCard();
  }, 30_000);
})();

addEventListener("pagehide", () => {
  if (countSaveTimer) storage.set({ azkarCount: state.azkarCount });
});
