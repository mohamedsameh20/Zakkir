// Azkar Extension — Prayer Times + Azkar (Hisn al-Muslim)
// Prayer times: api.aladhan.com (timingsByCity)
// Azkar:        bundled azkar.json (Hisn al-Muslim, nawafalqari/azkar-api)

const DEFAULTS = {
  view: "home",
  font: "Scheherazade",
  arSize: 0.9,
  zoom: 1.0,
  popupW: 420,
  popupH: 580,
  theme: "frutiger",
  palette: "default",
  neobrutalContrast: "quiet",
  city: "Cairo",
  country: "Egypt",
  method: 5,
  // Coordinates (preferred when useCoords is true)
  useCoords: false,
  lat: null,
  lng: null,
  locationName: "",
  // Which source produced the current location: gps | map | city | manual
  locationSource: "city",
  locationDetectedAt: null,
  // UI: which source panel is currently visible in settings (not persisted to value)
  locationTab: "city",
  // UI: active settings section (not persisted to value)
  settingsSection: "general",
  // Advanced (raw lat/lng inputs) collapsed by default
  locationAdvancedOpen: false,
  // Reminders + badge
  notificationsEnabled: true,
  reminderEnabled: false,
  reminderMinutes: 10,
  athanEnabled: true,
  reminderPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  iqamaEnabled: false,
  iqamaMinutes: 10,
  badgeEnabled: false,
  // Azkar
  category: "أذكار الصباح",
  autoTime: true,
  azkarIndex: 0,
  azkarCount: 0,
  azkarResetDate: null,
  prayerCache: null,
  // Monthly schedule view
  scheduleMonth: null, // "YYYY-MM"; null = current month
  scheduleDateMode: "g", // "g" = Gregorian column, "h" = Hijri column
  scheduleCache: {},
  // Highlight Mondays & Thursdays (Sunnah fasting days)
  sunnahFastHighlight: true,
  prayerCollapsed: false,
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
  // Monochrome and ethereal glass
  ["monochrome",        "Monochrome Glass"],
  ["monochrome-dark",   "Monochrome Dark Glass"],
  ["nebula",             "Nebula Glass Glow"],
  ["aurora",             "Northern Aurora Glass"],
  ["sahara-glass",       "Oasis Sahara Glass"],
  ["nebula-dark",        "Nebula Cosmic Dark"],
  ["aurora-dark",        "Aurora Midnight Dark"],
  ["sahara-glass-dark",  "Sahara Nocturnal Glass"],
  // macOS-inspired glass systems
  ["macos-ventura",      "macOS Ventura Glass"],
  ["macos-sequoia",      "macOS Sequoia Mist"],
  ["macos-sonoma",       "macOS Sonoma Sunset"],
  ["crystal",            "Crystal Diamond Glass"],
  ["mist",               "Neutral Mist Glass"],
  ["midnight",           "Midnight Indigo Glass"],
  ["jade",               "Translucent Jade Glass"],
  ["slatestudio",        "Slate Pro Studio Glass"],
  ["macos-ventura-dark", "macOS Ventura Dark"],
  ["macos-sequoia-dark", "macOS Sequoia Dark"],
  ["macos-sonoma-dark",  "macOS Sonoma Dark"],
  ["crystal-dark",       "Crystal Diamond Dark"],
  ["mist-dark",          "Neutral Mist Dark"],
  ["midnight-dark",      "Midnight Indigo Dark"],
  ["jade-dark",          "Translucent Jade Dark"],
  ["slatestudio-dark",   "Slate Pro Studio Dark"],
  // Fresh picks
  ["onyx",             "Onyx"],
  ["frutiger-sunset", "Frutiger Sunset"],
  ["prism",            "Prism"],
  ["opal",             "Opal"],
  ["fajr",             "Fajr"],
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
  // Additional design systems
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

// Curated country → cities list for users who prefer choosing from a list
// instead of entering coordinates. Names match what api.aladhan.com accepts.
const COUNTRY_CITIES = {
  "Saudi Arabia": ["Mecca","Medina","Riyadh","Jeddah","Dammam","Khobar","Taif","Tabuk","Abha","Khamis Mushait","Jubail","Yanbu","Hail","Buraydah","Najran"],
  "Egypt": ["Cairo","Alexandria","Giza","Mansoura","Tanta","Asyut","Luxor","Aswan","Port Said","Suez","Ismailia","Hurghada","Sharm El Sheikh","Damietta","Zagazig"],
  "United Arab Emirates": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Al Ain"],
  "Kuwait": ["Kuwait City","Hawalli","Salmiya","Jahra","Farwaniya"],
  "Qatar": ["Doha","Al Wakrah","Al Khor","Al Rayyan"],
  "Bahrain": ["Manama","Muharraq","Riffa","Hamad Town"],
  "Oman": ["Muscat","Salalah","Sohar","Nizwa","Sur"],
  "Jordan": ["Amman","Zarqa","Irbid","Aqaba","Madaba"],
  "Palestine": ["Jerusalem","Gaza","Hebron","Nablus","Ramallah","Bethlehem"],
  "Lebanon": ["Beirut","Tripoli","Sidon","Tyre","Zahle"],
  "Syria": ["Damascus","Aleppo","Homs","Hama","Latakia"],
  "Iraq": ["Baghdad","Basra","Mosul","Erbil","Najaf","Karbala","Sulaymaniyah"],
  "Yemen": ["Sanaa","Aden","Taiz","Hodeidah","Ibb"],
  "Turkey": ["Istanbul","Ankara","Izmir","Bursa","Antalya","Konya","Gaziantep"],
  "Morocco": ["Casablanca","Rabat","Marrakech","Fes","Tangier","Agadir","Meknes"],
  "Algeria": ["Algiers","Oran","Constantine","Annaba","Setif"],
  "Tunisia": ["Tunis","Sfax","Sousse","Kairouan","Bizerte"],
  "Libya": ["Tripoli","Benghazi","Misrata","Sabha"],
  "Sudan": ["Khartoum","Omdurman","Port Sudan","Kassala"],
  "Somalia": ["Mogadishu","Hargeisa","Kismayo","Bosaso"],
  "Pakistan": ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta"],
  "India": ["New Delhi","Mumbai","Hyderabad","Bangalore","Chennai","Kolkata","Lucknow","Ahmedabad"],
  "Bangladesh": ["Dhaka","Chittagong","Khulna","Sylhet","Rajshahi"],
  "Indonesia": ["Jakarta","Surabaya","Bandung","Medan","Makassar","Yogyakarta"],
  "Malaysia": ["Kuala Lumpur","George Town","Johor Bahru","Ipoh","Shah Alam"],
  "Singapore": ["Singapore"],
  "Iran": ["Tehran","Mashhad","Isfahan","Shiraz","Tabriz","Qom"],
  "Afghanistan": ["Kabul","Kandahar","Herat","Mazar-i-Sharif"],
  "Nigeria": ["Lagos","Abuja","Kano","Ibadan","Kaduna"],
  "United Kingdom": ["London","Manchester","Birmingham","Leeds","Glasgow","Liverpool","Bradford"],
  "United States": ["New York","Los Angeles","Chicago","Houston","Dallas","Detroit","Minneapolis","Washington","Atlanta"],
  "Canada": ["Toronto","Montreal","Vancouver","Ottawa","Calgary","Edmonton"],
  "France": ["Paris","Marseille","Lyon","Toulouse","Nice","Strasbourg"],
  "Germany": ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart"],
  "Netherlands": ["Amsterdam","Rotterdam","The Hague","Utrecht"],
  "Belgium": ["Brussels","Antwerp","Ghent"],
  "Spain": ["Madrid","Barcelona","Valencia","Seville","Granada"],
  "Italy": ["Rome","Milan","Naples","Turin","Florence"],
  "Sweden": ["Stockholm","Gothenburg","Malmö"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide"],
  "South Africa": ["Johannesburg","Cape Town","Durban","Pretoria"],
};

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
  const useCoords = state.useCoords && state.lat != null && state.lng != null;
  const sameLoc = cache && (useCoords
    ? (cache.lat === state.lat && cache.lng === state.lng)
    : (cache.city === state.city && cache.country === state.country));
  if (!force && cache && cache.date === today && sameLoc && cache.method === state.method) {
    prayers = cache.timings;
    hijri = cache.hijri;
    return;
  }
  try {
    let url;
    if (useCoords) {
      url = `https://api.aladhan.com/v1/timings/${ddmmyyyy()}?latitude=${state.lat}&longitude=${state.lng}&method=${state.method}`;
    } else {
      url = `https://api.aladhan.com/v1/timingsByCity/${ddmmyyyy()}?city=${encodeURIComponent(state.city)}&country=${encodeURIComponent(state.country)}&method=${state.method}`;
    }
    const r = await fetch(url);
    const j = await r.json();
    if (!j?.data?.timings) throw new Error("Bad response");
    const t = j.data.timings;
    prayers = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    const h = j.data.date.hijri;
    hijri = `${h.day} ${h.month.en} ${h.year} AH`;
    state.prayerCache = {
      date: today, city: state.city, country: state.country,
      lat: state.lat, lng: state.lng, method: state.method,
      timings: prayers, hijri,
    };
    storage.set({ prayerCache: state.prayerCache });
    lastErr = null;
  } catch (e) {
    lastErr = useCoords
      ? "Failed to load prayer times — check your connection."
      : "Failed to load prayer times — check city/country.";
  }
}

function nudgeBackground() {
  try { globalThis.chrome?.runtime?.sendMessage?.({ type: "refresh" }); } catch {}
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
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  unpin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M12 17v5"/><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2 3.24H7l2-3.24Z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
};

const IS_PINNED = (() => {
  try { return new URLSearchParams(location.search).get("pinned") === "1"; }
  catch { return false; }
})();

// ---------- views ----------
function headerHTML() {
  return `
    <div class="brand"><img class="logo" src="icon.png" alt=""/><span><span class="name">Zakkir</span><span class="brand-sub">Daily remembrance</span></span></div>
    <div class="icons">
      <button class="icon-btn" id="pinBtn" title="${IS_PINNED ? "Close pinned window" : "Pin (keep open)"}">${IS_PINNED ? icon.unpin : icon.pin}</button>
      <button class="icon-btn" data-go="schedule" title="Monthly schedule">${icon.cal}</button>
      <button class="icon-btn" data-go="settings" title="Settings">${icon.gear}</button>
    </div>`;
}

function timeToPrayer(name) {
  if (!prayers || !prayers[name]) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  let m = toMinutes(prayers[name]) - nowM;
  const passed = m < 0;
  if (passed) m += 1440; // next occurrence tomorrow
  return { h: Math.floor(m / 60), m: m % 60, passed };
}

function focusedLine() {
  if (!focusedPrayer || !prayers) return "";
  const t = timeToPrayer(focusedPrayer);
  if (!t) return "";
  const dur = t.h > 0 ? `${t.h}h ${t.m}m` : `${t.m}m`;
  const label = t.passed
    ? `<b>${focusedPrayer}</b> prayer was <b>${dur}</b> ago`
    : `<b>${focusedPrayer}</b> prayer in <b>${dur}</b>`;
  return `<div class="focus-line"><span>${label}</span><button class="focus-x" id="focusClose" title="Clear">×</button></div>`;
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
        <div class="prayer-meta"><span class="hijri">${hijri || ""}</span><button type="button" class="prayer-collapse" aria-label="Minimize prayer times" aria-expanded="true" title="Minimize prayer times">${icon.chevronDown}</button></div>
      </div>
      <div class="next-prayer">
        <div class="next-name">${nextName}</div>
        ${np ? `<div class="next-countdown"><strong>${np.h}<small>h</small></strong><span>:</span><strong>${String(np.m).padStart(2, "0")}<small>m</small></strong></div>` : ""}
      </div>
    </div>
    ${np ? `<div class="prayer-progress" title="${np.prev} → ${np.name}"><div style="width:${np.pct}%"></div></div>` : ""}
    <div class="prayer-grid">
      ${PRAYER_ORDER.map((name) => {
        const isCurrent = np && np.name === name;
        const isFocus = focusedPrayer === name;
        const t = prayers ? fmt12(prayers[name]) : "—";
        const cls = ["prayer"];
        if (isCurrent) cls.push("current");
        if (isFocus) cls.push("focused");
        return `<button type="button" class="${cls.join(" ")}" data-prayer="${name}"><div class="n">${name}</div><div class="t">${t}</div></button>`;
      }).join("")}
    </div>
    ${focusedLine()}
      </div>
    </div>
    ${lastErr ? `<div class="err">${lastErr}</div>` : ""}`;
}

function wirePrayerCollapse() {
  document.querySelectorAll(".prayer-collapse").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.prayerCollapsed = !state.prayerCollapsed;
      storage.set({ prayerCollapsed: state.prayerCollapsed });
      document.querySelectorAll(".prayer-collapse").forEach((item) => {
        item.setAttribute("aria-expanded", String(!state.prayerCollapsed));
      });
      $("#prayerRegion")?.classList.toggle("is-collapsed", state.prayerCollapsed);
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
  const overallPct = list.length ? Math.min(100, ((state.azkarIndex + 1) / list.length) * 100) : 0;
  const reading = splitOpeningFormula(z.content);
  const morning = state.category === MORNING_CAT;
  return `
    <div class="azkar-context ${morning ? "is-morning" : "is-evening"}" aria-live="polite">
      <span class="azkar-context-balance" aria-hidden="true"></span>
      <div class="azkar-context-copy"><strong lang="ar">${morning ? MORNING_CAT : EVENING_CAT}</strong></div>
      <span class="counter azkar-current-count" aria-label="Current dhikr progress"><span class="azkar-count-cur">${state.azkarCount}</span><span class="azkar-count-sep" aria-hidden="true">/</span><span class="azkar-count-total">${target}</span></span>
    </div>
    <div class="progress azkar-current-progress"><div style="transform:scaleX(${pct / 100})"></div></div>
    <div class="azkar-body-wrapper">
      ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
      <div class="dhikr" lang="ar">${reading.body}</div>
      ${z.description ? `<div class="desc">${z.description}</div>` : ""}
    </div>
    <div class="azkar-overall-track" role="progressbar" aria-label="Overall azkar progress" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${state.azkarIndex + 1}"><div style="transform:scaleX(${overallPct / 100})"></div></div>`;
}

function navIndicatorText() {
  const list = currentDhikrList();
  return `${state.azkarIndex + 1} / ${list.length || 0}`;
}

let azkarNavigationBusy = false;
let azkarTransitionTimer = null;
function animateAzkarSwap(direction, paint) {
  const el = $("#azkarTap");
  if (!el) { paint(); return; }
  if (azkarNavigationBusy) return;
  azkarNavigationBusy = true;
  if (azkarTransitionTimer) clearTimeout(azkarTransitionTimer);

  const startHeight = el.getBoundingClientRect().height;
  el.style.height = `${startHeight}px`;

  const innerContent = el.querySelector(".azkar-body-wrapper") || el.querySelector(".dhikr") || el;

  innerContent.style.transition = "transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease";
  innerContent.style.transform = `translateX(${direction > 0 ? -50 : 50}px)`;
  innerContent.style.opacity = "0.2";

  window.setTimeout(() => {
    paint();
    const newEl = $("#azkarTap");
    if (!newEl) { azkarNavigationBusy = false; return; }
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
  }, 110);
}

function navigateAzkar(direction) {
  const list = currentDhikrList();
  if (!list.length || azkarNavigationBusy) return;
  const paint = () => {
    state.azkarIndex = (state.azkarIndex + direction + list.length) % list.length;
    state.azkarCount = 0;
    storage.set({ azkarIndex: state.azkarIndex, azkarCount: 0 });
    patchAzkarCard();
  };
  animateAzkarSwap(direction, paint);
}

function renderHome() {
  return `
    <div class="app home-view">
      <div class="header" id="headerRegion">${headerHTML()}</div>
      <section class="card prayer-card ${state.prayerCollapsed ? "is-collapsed" : ""}" id="prayerRegion" aria-label="Prayer times">${prayerCardHTML()}</section>
      <button type="button" class="azkar-card" id="azkarTap" aria-label="Count this dhikr">${azkarCardHTML()}</button>
      <div class="nav-row">
        <button class="nav-btn" data-nav="-1" title="Previous dhikr">${icon.prev}<span>Previous</span></button>
        <button class="nav-btn reset-btn" id="resetBtn" title="Reset count">${icon.reset}<span>Reset</span></button>
        <button class="nav-btn" data-nav="1" title="Next dhikr"><span>Next</span>${icon.next}</button>
      </div>
    </div>
  `;
}


function locationCardHTML() {
  const src = state.locationSource || (state.useCoords ? "manual" : "city");
  const srcLabel = { gps: "via GPS", map: "via map", city: "via city", manual: "via manual" }[src] || "";
  const resolved = state.useCoords && state.lat != null
    ? (state.locationName
        ? `${state.locationName}`
        : `${Number(state.lat).toFixed(3)}, ${Number(state.lng).toFixed(3)}`)
    : `${state.city}, ${state.country}`;
  const detectedAt = state.locationDetectedAt
    ? new Date(state.locationDetectedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : null;
  const tab = state.locationTab || src;
  const tabs = [["gps", "GPS"], ["map", "Map"], ["city", "City"]];
  const panel =
    tab === "gps"
      ? `<div class="loc-panel">
          <button class="loc-btn primary" id="detectLoc">Detect my location</button>
          ${detectedAt && src === "gps" ? `<div class="loc-sub">Last detected ${detectedAt}</div>` : `<div class="loc-sub">Uses your browser's location. You'll be asked once for permission.</div>`}
        </div>`
      : tab === "map"
      ? `<div class="loc-panel">
          <button class="loc-btn primary" id="pickMap">Open map picker</button>
          <div class="loc-sub">Click anywhere on the map or search to drop a pin.</div>
        </div>`
      : `<div class="loc-panel">
          <div class="row">
            <label>Country</label>
            ${dropdownHTML("country", state.country, Object.keys(COUNTRY_CITIES).map((c) => ({ v: c, l: c })))}
          </div>
          <div class="row">
            <label>City</label>
            ${dropdownHTML("city", state.city, (COUNTRY_CITIES[state.country] || [state.city]).map((c) => ({ v: c, l: c })))}
          </div>
        </div>`;
  return `
    <div class="loc-card">
      <div class="loc-current">
        <div class="loc-resolved">${resolved}</div>
        ${srcLabel ? `<span class="loc-chip">${srcLabel}</span>` : ""}
      </div>
      <div class="seg" role="tablist">
        ${tabs.map(([id, lbl]) => `<button type="button" class="seg-btn ${tab === id ? "active" : ""}" data-loc-tab="${id}">${lbl}</button>`).join("")}
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
  // Re-wire country / city dropdowns within the location region
  wireDropdowns({
    country: async (v) => {
      const cities = COUNTRY_CITIES[v] || [];
      state.country = v;
      state.city = cities[0] || state.city;
      state.useCoords = false;
      state.locationName = "";
      state.locationSource = "city";
      state.locationTab = "city";
      storage.set({ country: state.country, city: state.city, useCoords: false, locationName: "", locationSource: "city", locationTab: "city", prayerCache: null });
      patchLocation();
      await loadPrayers(true);
      nudgeBackground();
      patchPrayerCard();
    },
    city: async (v) => {
      state.city = v;
      state.useCoords = false;
      state.locationName = "";
      state.locationSource = "city";
      state.locationTab = "city";
      storage.set({ city: state.city, useCoords: false, locationName: "", locationSource: "city", locationTab: "city", prayerCache: null });
      patchLocation();
      await loadPrayers(true);
      nudgeBackground();
      patchPrayerCard();
    },
  }, root);
  // Segmented tabs
  document.querySelectorAll("#locRegion [data-loc-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.locationTab = b.dataset.locTab;
      storage.set({ locationTab: state.locationTab });
      patchLocation();
    })
  );
  // Detect (GPS)
  const detect = $("#detectLoc");
  if (detect) detect.addEventListener("click", () => {
    if (!navigator.geolocation) { alert("Geolocation not supported in this browser."); return; }
    detect.disabled = true;
    detect.textContent = "Detecting…";
    navigator.geolocation.getCurrentPosition(async (pos) => {
      state.lat = +pos.coords.latitude.toFixed(5);
      state.lng = +pos.coords.longitude.toFixed(5);
      state.useCoords = true;
      state.locationName = "";
      state.locationSource = "gps";
      state.locationTab = "gps";
      state.locationDetectedAt = Date.now();
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${state.lat}&lon=${state.lng}&zoom=10`);
        const j = await r.json();
        const a = j.address || {};
        state.locationName = a.city || a.town || a.village || a.state || "";
      } catch {}
      storage.set({
        lat: state.lat, lng: state.lng, useCoords: true,
        locationName: state.locationName,
        locationSource: "gps", locationTab: "gps",
        locationDetectedAt: state.locationDetectedAt,
        prayerCache: null,
      });
      patchLocation();
      await loadPrayers(true);
      nudgeBackground();
      patchPrayerCard();
    }, (err) => {
      detect.disabled = false;
      detect.textContent = "Detect my location";
      alert("Couldn't get your location: " + err.message);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
  // Map picker (opens new tab)
  const pick = $("#pickMap");
  if (pick) pick.addEventListener("click", () => {
    const params = new URLSearchParams();
    if (state.lat != null) params.set("lat", state.lat);
    if (state.lng != null) params.set("lng", state.lng);
    const u = globalThis.chrome?.runtime?.getURL
      ? chrome.runtime.getURL("map.html") + (params.toString() ? "?" + params : "")
      : "map.html";
    if (globalThis.chrome?.tabs?.create) chrome.tabs.create({ url: u });
    else window.open(u, "_blank");
  });
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
  const useCoords = state.useCoords && state.lat != null && state.lng != null;
  return useCoords
    ? `v3|coords|${state.lat}|${state.lng}|${state.method}|${ym}`
    : `v3|city|${state.city}|${state.country}|${state.method}|${ym}`;
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
    const useCoords = state.useCoords && state.lat != null && state.lng != null;
    const url = useCoords
      ? `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${state.lat}&longitude=${state.lng}&method=${state.method}`
      : `https://api.aladhan.com/v1/calendarByCity/${y}/${m}?city=${encodeURIComponent(state.city)}&country=${encodeURIComponent(state.country)}&method=${state.method}`;
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
  const useCoords = state.useCoords && state.lat != null && state.lng != null;
  const where = useCoords
    ? (state.locationName || `${Number(state.lat).toFixed(2)}, ${Number(state.lng).toFixed(2)}`)
    : `${state.city}, ${state.country}`;
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

function themeCardsHTML(themes, featured = false) {
  return themes.map(([id, label]) => `
    <button class="theme-card ${featured ? "theme-featured" : ""} ${state.theme === id ? "active" : ""}" data-theme="${id}">
      <div class="sw" data-theme-sw="${id}"></div><span class="theme-name">${label}</span>
    </button>`).join("");
}
const CLASSIC_THEME_INDEX = THEMES.findIndex(([id]) => id === "light");
const DESIGN_ERA_THEME_COUNT = 3;
const GLASS_THEME_COUNT = 3;
const BOLD_THEME_COUNT = 1;
const GLASS_THEME_START = DESIGN_ERA_THEME_COUNT;
const BOLD_THEME_START = GLASS_THEME_START + GLASS_THEME_COUNT;
const FEATURED_THEME_COUNT = BOLD_THEME_START + BOLD_THEME_COUNT;

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
  const prayers = PRAYER_ORDER.filter((prayer) => state.reminderPrayers?.[prayer]);
  if (!prayers.length) return "Choose at least one prayer to start receiving notifications.";
  const moments = [];
  if (state.reminderEnabled) moments.push(`${state.reminderMinutes} minutes before`);
  if (state.athanEnabled) moments.push("at athan");
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
  for (const [id, active] of [["reminderEnabled", state.reminderEnabled], ["athanEnabled", state.athanEnabled], ["iqamaEnabled", state.iqamaEnabled]]) {
    const input = $("#" + id);
    if (!input) continue;
    input.checked = active;
    input.disabled = !enabled;
    input.closest(".timeline-item")?.classList.toggle("enabled", active);
  }
  for (const [id, active, value] of [["reminderMinutes", state.reminderEnabled, state.reminderMinutes], ["iqamaMinutes", state.iqamaEnabled, state.iqamaMinutes]]) {
    const select = $("#" + id);
    if (!select) continue;
    select.disabled = !enabled || !active;
    select.value = String(value);
  }
  document.querySelectorAll("[data-rp]").forEach((input) => {
    const active = !!state.reminderPrayers?.[input.dataset.rp];
    input.checked = active;
    input.disabled = !enabled;
    input.closest(".pt")?.classList.toggle("on", active);
  });
  const summary = document.querySelector(".notification-confirmation p");
  if (summary) summary.textContent = notificationSummary();
  document.querySelector(".notification-confirmation")?.classList.toggle("paused", !enabled);
}

const SETTINGS_SECTIONS = ["general", "notifications", "reading", "appearance", "window"];
const SETTINGS_NAV = [["general", "General"], ["notifications", "Notifications"], ["reading", "Reading"], ["appearance", "Appearance"], ["window", "Window"]];
const SETTINGS_META = {
  general: ["General", "Set your prayer location and schedule preferences."],
  notifications: ["Notifications", "Choose when Zakkir should remind you."],
  reading: ["Reading", "Tune Arabic text for comfortable daily reading."],
  appearance: ["Appearance", "Choose the visual atmosphere and accent color."],
  window: ["Window", "Adjust the popup to fit the way you use it."],
};

function settingsBodyHTML(id) {
  if (id === "general") return `
    <div id="locRegion">${locationCardHTML()}</div>
    <details class="loc-adv" ${state.locationAdvancedOpen ? "open" : ""}>
      <summary>Advanced (manual coordinates)</summary>
      <div class="row"><label>Latitude</label><input class="input" id="lat" type="number" step="0.0001" placeholder="e.g. 30.0444" value="${state.lat ?? ""}" /></div>
      <div class="row"><label>Longitude</label><input class="input" id="lng" type="number" step="0.0001" placeholder="e.g. 31.2357" value="${state.lng ?? ""}" /></div>
    </details>
    <div class="settings-card"><div class="row"><label>Calculation method</label>${dropdownHTML("method", state.method, METHODS.map(([v, n]) => ({ v, l: n })))}</div>
      <div class="row"><label>Highlight Mon/Thu (Sunnah fasting)</label><label class="switch"><input type="checkbox" id="sunnahFastHighlight" ${state.sunnahFastHighlight ? "checked" : ""}/><span></span></label></div></div>`;
  if (id === "notifications") {
    const notificationsOff = !state.notificationsEnabled;
    return `
    <div class="notification-master settings-card"><div><strong>Prayer notifications</strong><span>Receive timely reminders around each prayer.</span></div><label class="switch" aria-label="Prayer notifications"><input type="checkbox" id="notificationsEnabled" ${state.notificationsEnabled ? "checked" : ""}/><span></span></label></div>
    <div class="notification-config ${notificationsOff ? "is-paused" : ""}" aria-disabled="${notificationsOff}">
      <div class="notification-block settings-card"><div class="notification-block-head"><div><span class="notification-kicker">When to notify</span><strong>Prayer timeline</strong></div></div>
        <div class="notification-timeline">
          <div class="timeline-item ${state.reminderEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>Before athan</strong><span>Give me time to prepare.</span><select id="reminderMinutes" aria-label="Minutes before athan" ${!state.reminderEnabled || notificationsOff ? "disabled" : ""}>${minuteOptions(state.reminderMinutes, [5,10,15,20,30,45,60])}</select></div><label class="switch"><input type="checkbox" id="reminderEnabled" ${state.reminderEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
          <div class="timeline-item ${state.athanEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>At athan</strong><span>Notify me when prayer time begins.</span></div><label class="switch"><input type="checkbox" id="athanEnabled" ${state.athanEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
          <div class="timeline-item ${state.iqamaEnabled ? "enabled" : ""}"><span class="timeline-marker"></span><div class="timeline-copy"><strong>After athan</strong><span>Remind me for iqama.</span><select id="iqamaMinutes" aria-label="Minutes after athan" ${!state.iqamaEnabled || notificationsOff ? "disabled" : ""}>${minuteOptions(state.iqamaMinutes, [5,10,15,20,25,30])}</select></div><label class="switch"><input type="checkbox" id="iqamaEnabled" ${state.iqamaEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        </div>
      </div>
      <div class="notification-block settings-card"><div class="notification-block-head"><div><span class="notification-kicker">Prayers</span><strong>Apply reminders to</strong></div><div class="prayer-actions"><button type="button" data-prayer-action="all" ${notificationsOff ? "disabled" : ""}>All</button><button type="button" data-prayer-action="clear" ${notificationsOff ? "disabled" : ""}>Clear</button></div></div><div class="prayer-toggles">${PRAYER_ORDER.map((p) => `<label class="pt ${state.reminderPrayers?.[p] ? "on" : ""}"><input type="checkbox" data-rp="${p}" ${state.reminderPrayers?.[p] ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span>${p}</span></label>`).join("")}</div></div>
    </div>
    <div class="notification-confirmation ${state.notificationsEnabled ? "" : "paused"}"><span class="confirmation-dot"></span><p>${notificationSummary()}</p></div>`;
  }
  if (id === "reading") return `<div class="settings-card"><div class="font-grid">${Object.keys(FONT_MAP).map((f) => `<button class="pill ${state.font === f ? "active" : ""}" data-font="${f}" aria-label="${f}"><span class="font-sample">أبجد</span><span>${f}</span></button>`).join("")}</div><div class="row"><label>Arabic size</label><input type="range" min="0.7" max="2" step="0.05" value="${state.arSize}" id="arSize"/><span>${state.arSize.toFixed(2)}×</span></div><div class="preview">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></div>`;
  if (id === "appearance") return `<div class="settings-card"><div class="theme-intro">Choose a complete visual system. Themes can change geometry, depth, texture, motion, and color. The accent palette remains customizable.</div><div class="theme-collection-title"><span>Design eras</span><span>${DESIGN_ERA_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(0, GLASS_THEME_START), true)}</div><div class="theme-collection-title classic-title"><span>Glass and depth</span><span>${GLASS_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(GLASS_THEME_START, BOLD_THEME_START), true)}</div><div class="theme-collection-title classic-title"><span>Bold and experimental</span><span>${BOLD_THEME_COUNT}</span></div><div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES.slice(BOLD_THEME_START, FEATURED_THEME_COUNT), true)}</div>${state.theme === "neobrutal" ? `<div class="neobrutal-tone"><span>Neobrutalist contrast</span><div class="seg"><button class="seg-btn ${state.neobrutalContrast === "quiet" ? "active" : ""}" data-neobrutal-contrast="quiet">Quiet</button><button class="seg-btn ${state.neobrutalContrast === "high" ? "active" : ""}" data-neobrutal-contrast="high">High contrast</button></div></div>` : ""}<div class="theme-collection-title classic-title"><span>Atmospheric themes</span><span>${THEMES.slice(FEATURED_THEME_COUNT, CLASSIC_THEME_INDEX).length}</span></div><div class="theme-grid">${themeCardsHTML(THEMES.slice(FEATURED_THEME_COUNT, CLASSIC_THEME_INDEX))}</div><details class="settings-advanced"><summary>Browse classic themes (${THEMES.slice(CLASSIC_THEME_INDEX).length})</summary><div class="theme-grid">${themeCardsHTML(THEMES.slice(CLASSIC_THEME_INDEX))}</div></details></div><div class="settings-card"><div class="settings-card-title">Accent color</div><div class="palette-grid">${Object.entries(PALETTES).map(([id, p]) => `<button class="palette-chip ${state.palette === id ? "active" : ""}" data-palette="${id}" title="${p.name}" aria-label="${p.name}" style="background:${p.a || "transparent"};${!p.a ? "background:repeating-linear-gradient(45deg,var(--surface-2) 0 4px,var(--line) 4px 8px);" : ""}"></button>`).join("")}</div></div>`;
  if (id === "window") return `<div class="settings-card"><div class="row"><label>UI zoom</label><div class="zoom-row"><button class="zoom-btn" data-zoom="-0.1">−</button><span class="zoom-val">${Math.round(state.zoom * 100)}%</span><button class="zoom-btn" data-zoom="0.1">+</button></div></div><div class="row"><label>Width</label><input type="range" min="320" max="780" step="10" value="${state.popupW}" id="popupW"/><span>${state.popupW}px</span></div><div class="row"><label>Height</label><input type="range" min="420" max="600" step="10" value="${state.popupH}" id="popupH"/><span>${state.popupH}px</span></div></div><div class="settings-card badge-setting"><div><strong>Toolbar countdown</strong><span>Show time until the next prayer on the extension icon.</span></div><label class="switch"><input type="checkbox" id="badgeEnabled" ${state.badgeEnabled ? "checked" : ""}/><span></span></label></div>`;
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
    document.body.classList.remove("theme-" + id);
    if (THEME_BASES[id]) document.body.classList.remove("theme-" + THEME_BASES[id]);
  }
  const theme = validThemes.includes(state.theme) ? state.theme : DEFAULTS.theme;
  document.body.classList.add("theme-" + theme);
  if (THEME_BASES[theme]) document.body.classList.add("theme-" + THEME_BASES[theme]);
  document.body.classList.toggle("neobrutal-high", state.neobrutalContrast === "high");
  const font = FONT_MAP[state.font] ? state.font : "Scheherazade";
  document.body.style.setProperty("--ar-font", FONT_MAP[font]);
  document.body.style.setProperty("--ar-size", state.arSize);
  document.body.style.setProperty("--zoom", state.zoom);
  document.body.style.setProperty("--popup-w", state.popupW + "px");
  document.body.style.setProperty("--popup-h", state.popupH + "px");
  document.body.classList.toggle("pinned", IS_PINNED);

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
  const html = state.view === "settings" ? renderSettings()
    : state.view === "schedule" ? renderSchedule()
    : renderHome();
  setHTML(app, html);
  wire();
}

function patchCount(count, target) {
  const contextCounter = document.querySelector("#azkarTap .azkar-current-count");
  if (contextCounter) {
    const cur = contextCounter.querySelector(".azkar-count-cur");
    if (cur) cur.textContent = count;
    const total = contextCounter.querySelector(".azkar-count-total");
    if (total) total.textContent = target;
  }
  const bar = document.querySelector("#azkarTap .azkar-current-progress > div");
  if (bar) bar.style.transform = `scaleX(${Math.min(1, count / target)})`;
  const list = currentDhikrList();
  const overallProgress = document.querySelector("#azkarTap .azkar-overall-track");
  if (overallProgress) overallProgress.setAttribute("aria-valuenow", String(list.length ? state.azkarIndex + 1 : 0));
  const overallBar = document.querySelector("#azkarTap .azkar-overall-track > div");
  if (overallBar) overallBar.style.transform = `scaleX(${list.length ? Math.min(1, (state.azkarIndex + 1) / list.length) : 0})`;
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
      const context = el.querySelector(".azkar-context");
      if (context) {
        context.classList.toggle("is-morning", morning);
        context.classList.toggle("is-evening", !morning);
      }

      bodyWrapper.innerHTML = `
        ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
        <div class="dhikr" lang="ar">${reading.body}</div>
        ${z.description ? `<div class="desc">${z.description}</div>` : ""}`;

      patchCount(state.azkarCount, target);
    } else {
      setHTML(el, azkarCardHTML());
    }
  }
}

function patchPrayerCard() {
  const el = $("#prayerRegion");
  if (!el) return;
  const np = nextPrayer();
  const nextName = np ? np.name : (lastErr ? "Unavailable" : "Loading…");
  const currentName = el.querySelector(".next-name")?.textContent.trim();
  if (!currentName || currentName !== nextName) {
    setHTML(el, prayerCardHTML());
    el.classList.toggle("is-collapsed", state.prayerCollapsed);
    wirePrayerClicks();
    wirePrayerCollapse();
    return;
  }
  if (np) {
    const compact = el.querySelector(".prayer-collapsed-countdown");
    if (compact) compact.textContent = `${np.h}h ${String(np.m).padStart(2, "0")}m`;
    const hours = el.querySelector(".next-countdown strong:first-child");
    const minutes = el.querySelector(".next-countdown strong:last-child");
    if (hours) hours.innerHTML = `${np.h}<small>h</small>`;
    if (minutes) minutes.innerHTML = `${String(np.m).padStart(2, "0")}<small>m</small>`;
    const progress = el.querySelector(".prayer-progress > div");
    if (progress) progress.style.width = `${np.pct}%`;
  }
}

function wirePrayerClicks() {
  document.querySelectorAll("[data-prayer]").forEach((b) =>
    b.addEventListener("click", () => {
      const name = b.dataset.prayer;
      focusedPrayer = focusedPrayer === name ? null : name;
      patchPrayerCard();
    })
  );
  const fx = $("#focusClose");
  if (fx) fx.addEventListener("click", (e) => {
    e.stopPropagation();
    focusedPrayer = null;
    patchPrayerCard();
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
function syncNotificationDependencies() {
  const notificationsEnabled = $("#notificationsEnabled")?.checked ?? state.notificationsEnabled;
  const reminder = $("#reminderEnabled");
  const reminderMinutes = $("#reminderMinutes");
  if (reminderMinutes) {
    reminderMinutes.disabled = !notificationsEnabled || !reminder?.checked;
    reminderMinutes.closest(".row")?.classList.toggle("is-disabled", reminderMinutes.disabled);
  }
  const iqama = $("#iqamaEnabled");
  const iqamaMinutes = $("#iqamaMinutes");
  if (iqamaMinutes) {
    iqamaMinutes.disabled = !notificationsEnabled || !iqama?.checked;
    iqamaMinutes.closest(".row")?.classList.toggle("is-disabled", iqamaMinutes.disabled);
  }
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
  wirePrayerCollapse();
  const tap = $("#azkarTap");
  if (tap) tap.addEventListener("click", () => {
    const list = currentDhikrList();
    const z = list[state.azkarIndex]; if (!z) return;
    const target = parseInt(z.count, 10) || 1;
    const next = state.azkarCount + 1;
    if (next >= target) {
      // finish: patch in place, then advance through the same animated path as navigation
      patchCount(target, target);
      setTimeout(() => navigateAzkar(1), 280);
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

  if (state.view === "home") wirePrayerClicks();
  if (state.view === "settings") wireSettings();
}

function wireSettings() {
  wireDropdowns({
    method: async (v) => {
      state.method = parseInt(v, 10);
      storage.set({ method: state.method });
      await loadPrayers(true); render();
    },
  });
  if (state.settingsSection === "general") wireLocation();
  // Track Advanced disclosure open state
  const adv = document.querySelector(".loc-adv");
  if (adv) adv.addEventListener("toggle", () => {
    state.locationAdvancedOpen = adv.open;
    storage.set({ locationAdvancedOpen: adv.open });
  });

  // Settings interactions

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
        picker.innerHTML = `<span>Neobrutalist contrast</span><div class="seg"><button class="seg-btn ${state.neobrutalContrast === "quiet" ? "active" : ""}" data-neobrutal-contrast="quiet">Quiet</button><button class="seg-btn ${state.neobrutalContrast === "high" ? "active" : ""}" data-neobrutal-contrast="high">High contrast</button></div>`;
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
  // Auto-preview: derive bg/accent from each theme's own CSS variables when
  // no curated swatch entry exists, so every theme card shows a preview.
  function isLightSwatch(bg) {
    const m = String(bg).match(/#([0-9a-f]{6})\b/i) || String(bg).match(/#([0-9a-f]{3})\b/i);
    if (!m) return false;
    const hex = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62;
  }
  const cssThemeSwatches = (() => {
    const map = new Map();
    const themeRe = /(?:body|html)\.theme-([a-z0-9-]+)(?:\b|,)/;
    const collect = (rules) => {
      for (const rule of rules) {
        if (rule.selectorText) {
          const m = themeRe.exec(rule.selectorText);
          if (!m || map.has(m[1])) continue;
          const decl = {};
          for (const prop of rule.style) {
            if (prop.startsWith("--")) decl[prop] = rule.style.getPropertyValue(prop).trim();
          }
          if (!decl["--bg"] && !decl["--accent"] && !rule.style.background) continue;
          const bg = decl["--bg"] || rule.style.background || "#ffffff";
          map.set(m[1], { bg, a: decl["--accent"] || "#888888", light: isLightSwatch(bg) });
        } else if (rule.cssRules) {
          collect(Array.from(rule.cssRules));
        }
      }
    };
    for (const sheet of document.styleSheets) {
      try { collect(Array.from(sheet.cssRules)); } catch { /* cross-origin sheets are unreadable */ }
    }
    return map;
  })();
  document.querySelectorAll("[data-theme-sw]").forEach((el) => {
    const t = THEME_SW[el.dataset.themeSw] || cssThemeSwatches.get(el.dataset.themeSw);
    if (!t) return;
    el.style.cssText = `background:${t.bg};border:1px solid var(--line);position:relative;`;
    el.textContent = "";
    const dot = document.createElement("span");
    dot.className = `sw-scene sw-${t.style || (t.light ? "light" : "plain")}`;
    dot.style.setProperty("--sw-accent", t.a);
    el.appendChild(dot);
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

  const latI = $("#lat");
  if (latI) latI.addEventListener("change", async (e) => {
    const v = parseFloat(e.target.value);
    state.lat = Number.isFinite(v) ? v : null;
    state.useCoords = state.lat != null && state.lng != null;
    state.locationSource = "manual";
    storage.set({ lat: state.lat, useCoords: state.useCoords, locationSource: "manual", prayerCache: null });
    if (state.useCoords) { await loadPrayers(true); nudgeBackground(); patchLocation(); patchPrayerCard(); }
  });
  const lngI = $("#lng");
  if (lngI) lngI.addEventListener("change", async (e) => {
    const v = parseFloat(e.target.value);
    state.lng = Number.isFinite(v) ? v : null;
    state.useCoords = state.lat != null && state.lng != null;
    state.locationSource = "manual";
    storage.set({ lng: state.lng, useCoords: state.useCoords, locationSource: "manual", prayerCache: null });
    if (state.useCoords) { await loadPrayers(true); nudgeBackground(); patchLocation(); patchPrayerCard(); }
  });

  // --- Settings: reminders ---
  const ne = $("#notificationsEnabled");
  if (ne) ne.addEventListener("change", (e) => {
    state.notificationsEnabled = e.target.checked;
    storage.set({ notificationsEnabled: state.notificationsEnabled, _sentReminders: {} });
    nudgeBackground();
    if (state.notificationsEnabled && globalThis.Notification && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch {}
    }
    syncNotificationUI();
  });
  const re = $("#reminderEnabled");
  if (re) re.addEventListener("change", (e) => {
    state.reminderEnabled = e.target.checked;
    storage.set({ reminderEnabled: state.reminderEnabled });
    nudgeBackground();
    if (state.reminderEnabled && globalThis.Notification && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch {}
    }
    syncNotificationUI();
  });
  const ae = $("#athanEnabled");
  if (ae) ae.addEventListener("change", (e) => {
    state.athanEnabled = e.target.checked;
    storage.set({ athanEnabled: state.athanEnabled, _sentReminders: {} });
    nudgeBackground();
    if (state.athanEnabled && globalThis.Notification && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch {}
    }
    syncNotificationUI();
  });
  const rm = $("#reminderMinutes");
  if (rm) rm.addEventListener("change", (e) => {
    const v = parseInt(e.target.value, 10);
    state.reminderMinutes = v;
    storage.set({ reminderMinutes: v, _sentReminders: {} });
    nudgeBackground();
    syncNotificationUI();
  });
  const ie = $("#iqamaEnabled");
  if (ie) ie.addEventListener("change", (e) => {
    state.iqamaEnabled = e.target.checked;
    storage.set({ iqamaEnabled: state.iqamaEnabled, _sentReminders: {} });
    nudgeBackground();
    if (state.iqamaEnabled && globalThis.Notification && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch {}
    }
    syncNotificationUI();
  });
  const im = $("#iqamaMinutes");
  if (im) im.addEventListener("change", (e) => {
    const v = parseInt(e.target.value, 10);
    state.iqamaMinutes = v;
    storage.set({ iqamaMinutes: v, _sentReminders: {} });
    nudgeBackground();
    syncNotificationUI();
  });
  document.querySelectorAll("[data-prayer-action]").forEach((button) =>
    button.addEventListener("click", () => {
      const selected = button.dataset.prayerAction === "all";
      state.reminderPrayers = Object.fromEntries(PRAYER_ORDER.map((prayer) => [prayer, selected]));
      storage.set({ reminderPrayers: state.reminderPrayers });
      nudgeBackground();
      syncNotificationUI();
    })
  );
  document.querySelectorAll("[data-rp]").forEach((c) =>
    c.addEventListener("change", (e) => {
      const name = e.target.dataset.rp;
      state.reminderPrayers = { ...state.reminderPrayers, [name]: e.target.checked };
      storage.set({ reminderPrayers: state.reminderPrayers });
      nudgeBackground();
      syncNotificationUI();
    })
  );
  const be = $("#badgeEnabled");
  if (be) be.addEventListener("change", (e) => {
    state.badgeEnabled = e.target.checked;
    storage.set({ badgeEnabled: state.badgeEnabled });
    nudgeBackground();
  });
  const sf = $("#sunnahFastHighlight");
  if (sf) sf.addEventListener("change", (e) => {
    state.sunnahFastHighlight = e.target.checked;
    storage.set({ sunnahFastHighlight: state.sunnahFastHighlight });
  });
  syncNotificationDependencies();
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
  // Migrate: infer location source for users upgrading from older versions
  if (!data.locationSource) {
    state.locationSource = state.useCoords ? "manual" : "city";
    state.locationTab = state.locationSource;
    storage.set({ locationSource: state.locationSource, locationTab: state.locationTab });
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
  nudgeBackground();

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
