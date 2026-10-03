// Zakkir for Android: the UI that runs inside the app's WebView.
// Prayer times: api.aladhan.com (timings)
// Azkar:        bundled azkar.json (Hisn al-Muslim, nawafalqari/azkar-api),
//               inlined by scripts/generate-renderer.cjs as __ZAKKIR_AZKAR__.
// The native shell (App.tsx) is reached only through window.ZakkirNative,
// defined in web/bridge.js.

const DEFAULTS = {
  view: "home",
  font: "Scheherazade",
  arSize: 0.9,
  zoom: 1.0,
  popupW: 763,
  popupH: 800,
  theme: "frutiger",
  palette: "default",
  customAccent: "",
  customBg: "",
  customSurface: "",
  customInk: "",
  neobrutalContrast: "quiet",
  settingsSection: "general",
  lat: 30.0444,
  lng: 31.2357,
  locationName: "Cairo, Egypt",
  locationSet: false,
  arabicDigits: false,
  locationMethod: "manual",
  locationTab: "city",
  locationAdvancedOpen: false,
  method: 5,
  category: "أذكار الصباح",
  autoTime: true,
  azkarIndex: 0,
  azkarCount: 0,
  azkarCounts: {},
  azkarHintDismissed: false,
  azkarResetDate: null,
  prayerCache: null,
  offlinePrayerCache: null,
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
  scheduleMonth: null,
  scheduleDateMode: "g",
  scheduleCache: {},
  sunnahFastHighlight: true,
  prayerCollapsed: false,
  azkarNavigation: "buttons-and-swipe",
  language: "",
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

// ---------- i18n ----------
// `language` is "" (auto-detect) until first boot; then "en" or "ar".
const STRINGS = {
  en: {
    "nav.primary": "Primary navigation",
    "nav.home": "Home",
    "nav.schedule": "Schedule",
    "nav.settings": "Settings",
    "prayer.next": "Next prayer",
    "prayer.in": "in",
    "nav.back": "Back",
    "azkar.countHint": "Tap to count",
    "prayer.unavailable": "Unavailable",
    "prayer.loading": "Loading…",
    "prayer.show": "Show prayer times",
    "prayer.minimize": "Minimize prayer times",
    "prayer.times": "Prayer times",
    "time.h": "h",
    "time.m": "m",
    "time.ago": "{time} ago",
    "time.in": "in {time}",
    "detail.next": "→ {name} at {time}",
    "azkar.count": "Count this dhikr",
    "azkar.prev": "Previous",
    "azkar.next": "Next",
    "azkar.reset": "Reset",
    "azkar.prev.title": "Previous dhikr",
    "azkar.next.title": "Next dhikr",
    "azkar.reset.title": "Reset count",
    "azkar.undo": "Undo",
    "azkar.undo.title": "Undo one count (hold to reset)",
    "azkar.done": "Completed",
    "azkar.partial": "{completed} of {total} done",
    "azkar.accept": "May Allah accept it from you",
    "azkar.nextMorning": "Morning azkar begin at Fajr · {time}",
    "azkar.nextEvening": "Evening azkar begin at Maghrib · {time}",
    "azkar.review": "Tap to read them again",
    "azkar.continue": "Tap to continue where you left off",
    "azkar.tapHint": "Tap the card to count",
    "azkar.overall": "Overall progress",
    "azkar.overall.aria": "Overall Azkar progress",
    "azkar.current.aria": "Current dhikr progress",
    "sched.title": "Schedule",
    "sched.prevMonth": "Previous month",
    "sched.nextMonth": "Next month",
    "sched.gregorian": "Gregorian",
    "sched.hijri": "Hijri",
    "sched.dateHeader": "Date",
    "sched.ah": "AH",
    "sched.loading": "Loading schedule…",
    "sched.updating": "Updating…",
    "sched.error": "Showing saved times — couldn't refresh them.",
    "sched.errorShort": "Couldn't reach the prayer-times service. Try again.",
    "sched.errorOffline": "You're offline and this month isn't saved yet. Connect once to load it.",
    "sched.retry": "Retry",
    "sched.fast.monday": "Sunnah fast — Monday",
    "sched.fast.thursday": "Sunnah fast — Thursday",
    "sched.methodFallback": "Method {method}",
    "loc.viaPreset": "via city",
    "loc.viaGps": "via GPS",
    "loc.gps": "GPS",
    "loc.city": "City",
    "loc.country": "Country",
    "loc.detect": "Detect my location",
    "loc.detect.sub": "Uses your device's location. You'll be asked once for permission.",
    "loc.selectCountry": "-- Select Country --",
    "loc.selectCity": "-- Select City --",
    "loc.detecting": "Detecting…",
    "loc.failed": "Failed — try manual",
    "loc.advanced": "Advanced (manual coordinates)",
    "loc.latitude": "Latitude",
    "loc.longitude": "Longitude",
    "loc.latPh": "e.g. 30.0444",
    "loc.lngPh": "e.g. 31.2357",
    "loc.useCoords": "Use These Coordinates",
    "loc.method": "Calculation method",
    "loc.sunnahFast": "Highlight Mon/Thu (Sunnah fasting)",
    "settings.title": "Settings",
    "settings.nav.aria": "Settings sections",
    "settings.general": "General",
    "settings.notifications": "Notifications",
    "settings.reading": "Reading",
    "settings.appearance": "Appearance",
    "settings.general.desc": "Set your prayer location and schedule preferences.",
    "settings.notifications.desc": "Choose when Zakkir should remind you.",
    "settings.reading.desc": "Tune Arabic text for comfortable daily reading.",
    "settings.appearance.desc": "Choose the visual atmosphere and accent color.",
    "lang.label": "Language",
    "lang.en": "English",
    "lang.ar": "العربية",
    "notify.master": "Prayer notifications",
    "notify.master.sub": "Receive timely reminders around each prayer.",
    "notify.when": "When to notify",
    "notify.reminders": "Prayer reminders",
    "notify.before": "Before athan",
    "notify.before.sub": "Prepare for the prayer ahead of time.",
    "notify.at": "At athan",
    "notify.at.sub": "Notify when the exact prayer time begins.",
    "notify.after": "After athan",
    "notify.after.sub": "Remind me when it is time for iqama.",
    "notify.aria.before": "Notify before athan",
    "notify.aria.at": "Notify at athan",
    "notify.aria.after": "Notify for iqama",
    "notify.beforeMin": "Minutes before {prayer}",
    "notify.afterMin": "Minutes after {prayer}",
    "notify.beforeLbl": "Before",
    "notify.afterLbl": "After",
    "welcome.title": "Where are you praying?",
    "welcome.sub": "Prayer times depend on where you are. Your location is only used to fetch them.",
    "welcome.continue": "Continue",
    "loc.notSet": "Not chosen yet",
    "lang.digits": "Numerals",
    "notify.min": "min",
    "notify.beforeAll": "Minutes before athan, for every prayer",
    "notify.afterAll": "Minutes after athan, for every prayer",
    "notify.prayers": "Which prayers",
    "notify.customise": "Customise per prayer",
    "notify.customise.sub": "Set different minutes for a single prayer. Changing the main value above resets these.",
    "notify.sound": "Reminder sound",
    "notify.testSound": "Test Sound",
    "notify.stopPreview": "Stop Preview",
    "notify.paused": "Prayer notifications are paused. Your choices are saved.",
    "notify.chooseOne": "Choose at least one prayer to start receiving reminders.",
    "notify.chooseWhen": "Choose when you want to be notified.",
    "notify.allFive": "all five prayers",
    "notify.willBe": "You will be notified {events} for {prayers}.",
    "notify.evt.before": "before athan",
    "notify.evt.at": "at athan",
    "notify.evt.after": "after athan",
    "reading.arSize": "Arabic size",
    "reading.appScale": "App scale",
    "reading.navMode": "Azkar navigation",
    "reading.navMode.aria": "Azkar navigation mode",
    "reading.both": "Buttons + swipe",
    "reading.swipe": "Swipe only",
    "reading.buttons": "Buttons only",
    "appearance.intro": "Pick a look you enjoy opening every day. The accent colour below works with any theme.",
    "appearance.accent": "Accent color",
    "neobrutal.label": "Neobrutalist contrast",
    "neobrutal.quiet": "Quiet",
    "neobrutal.high": "High contrast",
    "err.prayers": "Failed to load prayer times — check your location.",
    "prayers.offline": "Offline — saved prayer times",
    "prayers.stale": "Offline — showing last saved prayer times.",
    "err.azkar": "Failed to load azkar data.",
    "fmt.am": "AM",
    "fmt.pm": "PM",
  },
  ar: {
    "nav.primary": "القائمة الرئيسية",
    "nav.home": "الرئيسية",
    "nav.schedule": "المواقيت",
    "nav.settings": "الإعدادات",
    "prayer.next": "الصلاة القادمة",
    "prayer.in": "بعد",
    "nav.back": "رجوع",
    "azkar.countHint": "اضغط للعدّ",
    "prayer.unavailable": "غير متاحة",
    "prayer.loading": "جارٍ التحميل…",
    "prayer.show": "عرض مواقيت الصلاة",
    "prayer.minimize": "طي مواقيت الصلاة",
    "prayer.times": "مواقيت الصلاة",
    "time.h": "س",
    "time.m": "د",
    "time.ago": "مضت منذ {time}",
    "time.in": "بعد {time}",
    "detail.next": "← {name} بعد {time}",
    "azkar.count": "عدد التكرار",
    "azkar.prev": "السابق",
    "azkar.next": "التالي",
    "azkar.reset": "إعادة ضبط",
    "azkar.prev.title": "الذكر السابق",
    "azkar.next.title": "الذكر التالي",
    "azkar.reset.title": "إعادة ضبط العداد",
    "azkar.undo": "تراجع",
    "azkar.undo.title": "تراجع عن عدّة واحدة (اضغط مطوّلًا لإعادة الضبط)",
    "azkar.done": "تمّت",
    "azkar.partial": "تمّ {completed} من {total}",
    "azkar.accept": "",
    "azkar.nextMorning": "أذكار الصباح بعد الفجر · {time}",
    "azkar.nextEvening": "أذكار المساء بعد المغرب · {time}",
    "azkar.review": "اضغط لقراءتها مرة أخرى",
    "azkar.continue": "اضغط لمتابعة ما تبقّى",
    "azkar.tapHint": "اضغط على البطاقة للتسبيح",
    "azkar.overall": "إجمالي الأذكار",
    "azkar.overall.aria": "إجمالي التقدم في الأذكار",
    "azkar.current.aria": "تقدم الذكر الحالي",
    "sched.title": "جدول المواقيت",
    "sched.prevMonth": "الشهر السابق",
    "sched.nextMonth": "الشهر التالي",
    "sched.gregorian": "ميلادي",
    "sched.hijri": "هجري",
    "sched.dateHeader": "التاريخ",
    "sched.ah": "هـ",
    "sched.loading": "جارٍ تحميل الجدول…",
    "sched.updating": "جارٍ التحديث…",
    "sched.error": "نعرض المواقيت المحفوظة — تعذّر تحديثها.",
    "sched.errorShort": "تعذّر الوصول إلى خدمة المواقيت. حاول مرة أخرى.",
    "sched.errorOffline": "أنت غير متصل وهذا الشهر غير محفوظ بعد. اتصل مرة واحدة لتحميله.",
    "sched.retry": "إعادة المحاولة",
    "sched.fast.monday": "صيام الاثنين (سُنّة)",
    "sched.fast.thursday": "صيام الخميس (سُنّة)",
    "sched.methodFallback": "طريقة الحساب {method}",
    "loc.viaPreset": "حسب المدينة",
    "loc.viaGps": "حسب الموقع الجغرافي (GPS)",
    "loc.gps": "GPS",
    "loc.city": "المدينة",
    "loc.country": "الدولة",
    "loc.detect": "تحديد الموقع تلقائيًا",
    "loc.detect.sub": "تحديد الموقع الحالي تلقائيًا لحساب أوقات الصلاة بدقة.",
    "loc.selectCountry": "-- اختر الدولة --",
    "loc.selectCity": "-- اختر المدينة --",
    "loc.detecting": "جارٍ تحديد الموقع…",
    "loc.failed": "تعذّر التحديد — يُرجى الاختيار يدويًا",
    "loc.advanced": "إعدادات متقدمة (الإحداثيات)",
    "loc.latitude": "خط العرض",
    "loc.longitude": "خط الطول",
    "loc.latPh": "مثال: 30.0444",
    "loc.lngPh": "مثال: 31.2357",
    "loc.useCoords": "حفظ الإحداثيات",
    "loc.method": "طريقة حساب المواقيت",
    "loc.sunnahFast": "التذكير بصيام الاثنين والخميس",
    "settings.title": "الإعدادات",
    "settings.nav.aria": "أقسام الإعدادات",
    "settings.general": "عام",
    "settings.notifications": "الإشعارات",
    "settings.reading": "القراءة",
    "settings.appearance": "المظهر",
    "settings.general.desc": "ضبط موقع أوقات الصلاة وإعدادات التوقيت.",
    "settings.notifications.desc": "تخصيص التنبيهات وإشعارات الأذان والإقامة.",
    "settings.reading.desc": "تخصيص الخطوط وحجم الخطوط لتسهيل القراءة.",
    "settings.appearance.desc": "تخصيص السمات والمظهر وألوان الواجهة.",
    "lang.label": "اللغة",
    "lang.en": "English",
    "lang.ar": "العربية",
    "notify.master": "تفعيل الإشعارات",
    "notify.master.sub": "التنبيه عند حلول أوقات الصلاة والإقامة.",
    "notify.when": "مواعيد الإشعارات",
    "notify.reminders": "أنواع التنبيهات",
    "notify.before": "التنبيه قبل الأذان",
    "notify.before.sub": "التذكير بالاستعداد للصلاة قبل موعدها.",
    "notify.at": "تنبيه الأذان",
    "notify.at.sub": "التنبيه عند دخول وقت الصلاة.",
    "notify.after": "تنبيه الإقامة",
    "notify.after.sub": "التذكير بموعد إقامة الصلاة.",
    "notify.aria.before": "تفعيل التنبيه قبل الأذان",
    "notify.aria.at": "تفعيل تنبيه الأذان",
    "notify.aria.after": "تفعيل تنبيه الإقامة",
    "notify.beforeMin": "التنبيه قبل {prayer} بـ",
    "notify.afterMin": "التنبيه بعد {prayer} بـ",
    "notify.beforeLbl": "التنبيه قبل",
    "notify.afterLbl": "الإقامة بعد",
    "welcome.title": "أين أنت الآن؟",
    "welcome.sub": "تختلف مواقيت الصلاة بحسب مكانك، ولا يُستخدم موقعك إلا لجلبها.",
    "welcome.continue": "متابعة",
    "loc.notSet": "لم يُحدَّد بعد",
    "lang.digits": "الأرقام",
    "notify.min": "د",
    "notify.beforeAll": "عدد الدقائق قبل الأذان لكل الصلوات",
    "notify.afterAll": "عدد الدقائق بعد الأذان لكل الصلوات",
    "notify.prayers": "الصلوات المُنبَّه لها",
    "notify.customise": "تخصيص كل صلاة",
    "notify.customise.sub": "اضبط دقائق مختلفة لصلاة بعينها. تغيير القيمة الرئيسية أعلاه يعيد ضبطها.",
    "notify.sound": "نغمة التنبيه",
    "notify.testSound": "تجربة النغمة",
    "notify.stopPreview": "إيقاف الصوت",
    "notify.paused": "الإشعارات معطلة حاليًا. تم حفظ تفضيلاتك.",
    "notify.chooseOne": "يُرجى تحديد صلاة واحدة على الأقل لتفعيل التنبيهات.",
    "notify.chooseWhen": "يُرجى تحديد وقت التنبيه (قبل الأذان، عند الأذان، أو عند الإقامة).",
    "notify.allFive": "جميع الصلوات الخمس",
    "notify.willBe": "سيتم تنبيهك {events} لصلوات: {prayers}.",
    "notify.evt.before": "قبل الأذان",
    "notify.evt.at": "عند الأذان",
    "notify.evt.after": "عند الإقامة",
    "reading.arSize": "حجم الخط العربي",
    "reading.appScale": "حجم واجهة التطبيق",
    "reading.navMode": "طريقة التنقل بين الأذكار",
    "reading.navMode.aria": "نمط التنقل بين الأذكار",
    "reading.both": "الأزرار والسحب",
    "reading.swipe": "السحب باللمس فقط",
    "reading.buttons": "الأزرار فقط",
    "appearance.intro": "اختر مظهرًا تحبّ أن تفتحه كل يوم. ويمكنك اختيار لون مميّز يناسب أي سمة.",
    "appearance.accent": "اللون الرئيسي للواجهة",
    "neobrutal.label": "درجة التباين",
    "neobrutal.quiet": "عادي",
    "neobrutal.high": "تباين مرتفع",
    "err.prayers": "تعذّر تحميل أوقات الصلاة — يُرجى التحقق من الموقع.",
    "prayers.offline": "بدون إنترنت — أوقات الصلاة المحفوظة",
    "prayers.stale": "بدون إنترنت — عرض آخر أوقات الصلاة المحفوظة.",
    "err.azkar": "تعذّر تحميل بيانات الأذكار.",
    "fmt.am": "ص",
    "fmt.pm": "م",
  },
};

const PRAYER_NAMES = { Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء" };

function t(key, vars) {
  const dict = state?.language === "ar" ? STRINGS.ar : STRINGS.en;
  let s = dict[key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

function isArabic() { return state?.language === "ar"; }

function prayerName(name) { return isArabic() ? (PRAYER_NAMES[name] || name) : name; }

function humanList(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (isArabic()) return items.slice(0, -1).join("، ") + " و" + items[items.length - 1];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
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
    storage.set({ azkarCount: count, azkarCounts: state.azkarCounts });
    countSaveTimer = null;
  }, 180);
}

function cancelPendingAzkarCount() {
  clearTimeout(countSaveTimer);
  countSaveTimer = null;
}

const FONT_MAP = {
  Scheherazade: '"Scheherazade New", serif',
  Amiri: '"Amiri", serif',
  "Noto Naskh Arabic": '"Noto Naskh Arabic", serif',
  Cairo: '"Cairo", sans-serif',
};

// Minimal themes — no gradients, clean surfaces
const THEMES = [
  ["frutiger",      "Frutiger Aero"],
  ["frutiger-dark", "Frutiger Space"],
  ["liquidglass",   "Liquid Glass"],
  ["sakura",        "Sakura"],
  ["light",         "Light"],
  ["dark",          "Dark"],
  ["onyx",          "Onyx"],
  ["mushaf",        "Mushaf"],
  ["layl",          "Layl"],
  ["zellige",       "Zellige"],
];
// Arabic names describe each look in Arabic rather than transliterating it.
const THEME_NAMES_AR = {
  frutiger: "مروج",
  "frutiger-dark": "مجرّة",
  liquidglass: "زجاج",
  sakura: "أزهار",
  light: "فاتح",
  dark: "داكن",
  onyx: "أسود حالك",
  mushaf: "مصحف",
  layl: "ليل",
  zellige: "زليج",
};

function themeName(id) {
  if (isArabic()) {
    return THEME_NAMES_AR[id] || (THEMES.find(([tid]) => tid === id) || ["", id])[1] || id;
  }
  return (THEMES.find(([tid]) => tid === id) || ["", id])[1] || id;
}

const THEME_BASES = {
  "frutiger-dark": "frutiger",
};

// Organized Palette Categories (Lightest -> Darkest)
// Accents named for things from the culture the app serves. Any accent is
// nudged toward the theme's ink until it reads at 4.5:1 on that theme's
// cards (see readableAccent), so all of them work on light and dark themes.
const PALETTES = {
  default:     { name: "Theme color" },
  emerald:     { name: "Emerald",     a: "#0f8a5f" },
  turquoise:   { name: "Turquoise",   a: "#0e8a96" },
  lapis:       { name: "Lapis",       a: "#2f5bd3" },
  amethyst:    { name: "Amethyst",    a: "#7a3fc0" },
  pomegranate: { name: "Pomegranate", a: "#c0263f" },
  henna:       { name: "Henna",       a: "#b5532a" },
  saffron:     { name: "Saffron",     a: "#e08a00" },
  olive:       { name: "Olive",       a: "#6b7a1e" },
  gold:        { name: "Gold",        a: "#c79a1e" },
};

const PALETTE_GROUPS = [
  { title: "", keys: Object.keys(PALETTES) },
];

const PALETTE_NAMES_AR = {
  default: "لون السمة",
  emerald: "زمرّدي",
  turquoise: "فيروزي",
  lapis: "لازوردي",
  amethyst: "بنفسجي",
  pomegranate: "رمّاني",
  henna: "حنّائي",
  saffron: "زعفراني",
  olive: "زيتوني",
  gold: "ذهبي",
};

const PALETTE_GROUP_TITLES_AR = {};

function paletteName(id) {
  if (!isArabic()) return PALETTES[id]?.name || id;
  return PALETTE_NAMES_AR[id] || PALETTES[id]?.name || id;
}
function paletteGroupTitle(title) {
  return isArabic() ? (PALETTE_GROUP_TITLES_AR[title] || title) : title;
}

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const METHODS = [
  [2, "ISNA (North America)"],
  [3, "Muslim World League"],
  [4, "Umm Al-Qura (Makkah)"],
  [5, "Egyptian Authority"],
  [8, "Gulf Region"],
  [13, "Diyanet (Turkey)"],
];

const METHOD_NAMES_AR = {
  2: "الجمعية الإسلامية لأمريكا الشمالية (ISNA)",
  3: "رابطة العالم الإسلامي",
  4: "أم القرى (مكة المكرمة)",
  5: "الهيئة المصرية العامة للمساحة",
  8: "منطقة الخليج",
  13: "دائرة الشؤون الدينية التركية",
};

function methodName(id) {
  const en = (METHODS.find(([v]) => v === id) || [, t("sched.methodFallback", { method: id })])[1];
  if (!isArabic()) return en;
  return METHOD_NAMES_AR[id] || en;
}
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

// Arabic labels for preset countries/cities (used in Arabic UI mode).
const PRESETS_AR = {
  "Egypt (مصر)": { ar: "مصر", cities: { "Cairo (القاهرة)": "القاهرة", "Alexandria (الإسكندرية)": "الإسكندرية", "Giza (الجيزة)": "الجيزة", "Mansoura (المنصورة)": "المنصورة", "Tanta (طنطا)": "طنطا", "Asyut (أسيوط)": "أسيوط" } },
  "Saudi Arabia (المملكة العربية السعودية)": { ar: "السعودية", cities: { "Makkah (مكة المكرمة)": "مكة المكرمة", "Madinah (المدينة المنورة)": "المدينة المنورة", "Riyadh (الرياض)": "الرياض", "Jeddah (جدة)": "جدة", "Dammam (الدمام)": "الدمام" } },
  "Palestine (فلسطين)": { ar: "فلسطين", cities: { "Al-Quds (القدس)": "القدس", "Gaza (غزة)": "غزة", "Hebron (الخليل)": "الخليل", "Nablus (نابلس)": "نابلس", "Ramallah (رام الله)": "رام الله" } },
  "UAE (الإمارات العربية المتحدة)": { ar: "الإمارات", cities: { "Dubai (دبي)": "دبي", "Abu Dhabi (أبوظبي)": "أبوظبي", "Sharjah (الشارقة)": "الشارقة" } },
  "Jordan (الأردن)": { ar: "الأردن", cities: { "Amman (عمان)": "عمّان", "Zarqa (الزرقاء)": "الزرقاء", "Irbid (إربد)": "إربد" } },
  "Turkey (تركيا)": { ar: "تركيا", cities: { "Istanbul (إسطنبول)": "إسطنبول", "Ankara (أنقرة)": "أنقرة", "Izmir (إزمير)": "إزمير" } },
  "Morocco (المغرب)": { ar: "المغرب", cities: { "Casablanca (الدار البيضاء)": "الدار البيضاء", "Rabat (الرباط)": "الرباط", "Marrakech (مراكش)": "مراكش" } },
  "Malaysia (ماليزيا)": { ar: "ماليزيا", cities: { "Kuala Lumpur (كوالالمبور)": "كوالالمبور", "Penang (بينانق)": "بينانق" } },
  "United Kingdom (المملكة المتحدة)": { ar: "بريطانيا", cities: { "London": "لندن", "Birmingham": "برمنغهام", "Manchester": "مانشستر" } },
  "USA (الولايات المتحدة)": { ar: "أمريكا", cities: { "New York": "نيويورك", "Los Angeles": "لوس أنجلوس", "Chicago": "شيكاغو" } },
  "Qatar (قطر)": { ar: "قطر", cities: { "Doha (الدوحة)": "الدوحة" } },
  "Kuwait (الكويت)": { ar: "الكويت", cities: { "Kuwait City (مدينة الكويت)": "مدينة الكويت" } },
};

function presetCountryLabel(key) {
  if (isArabic()) return PRESETS_AR[key]?.ar || String(key).split(" (")[0] || key;
  return String(key).split(" (")[0];
}
function presetCityLabel(countryKey, cityKey) {
  if (isArabic()) return PRESETS_AR[countryKey]?.cities?.[cityKey] || String(cityKey).split(" (")[0] || cityKey;
  return String(cityKey).split(" (")[0];
}

let state = { ...DEFAULTS };
let AZKAR_DATA = null; // raw json
let CATS = [];
let prayers = null;
let tomorrowPrayers = null;
let hijri = null;
let lastErr = null;
let usingCachedPrayers = false;
let offlinePrayerNotice = false;
let activePrayer = null; // UI-only, not persisted
let activeAudio = null;
let mobileNavTransition = null;
let prayerLoadSequence = 0;
let loadedPrayerDate = null;

// ---------- storage ----------
// Settings live in the native shell's AsyncStorage.
// Keys that were actually stored, as opposed to filled in from DEFAULTS.
const storedKeys = new Set();
const storage = {
  get: () =>
    ZakkirNative.loadSettings()
      .then((raw) => {
        storedKeys.clear();
        Object.keys(raw || {}).forEach((key) => storedKeys.add(key));
        return raw ? { ...DEFAULTS, ...raw } : { ...DEFAULTS };
      })
      .catch(() => ({ ...DEFAULTS })),
  set: (patch) => {
    ZakkirNative.saveSettings(patch);
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
  state.azkarCount = itemCount(0);
  storage.set({ category: want, azkarIndex: 0, azkarCount: state.azkarCount });
  return true;
}

function currentDhikrList() {
  if (!AZKAR_DATA) return [];
  return flattenCategory(AZKAR_DATA[state.category] || []);
}

// Today's count for every dhikr, keyed "<category>|<index>", so moving between
// items keeps their progress. Cleared by the daily reset. state.azkarCount
// mirrors the current item's entry.
function itemKey(index = state.azkarIndex) { return `${state.category}|${index}`; }
function itemTarget(z) { return parseInt(z?.count, 10) || 1; }
function itemCount(index) { return (state.azkarCounts || {})[itemKey(index)] || 0; }
function setItemCount(n) {
  state.azkarCount = n;
  state.azkarCounts = { ...(state.azkarCounts || {}), [itemKey()]: n };
  persistAzkarCount(n);
}

/** Items finished today, not the current position. */
function azkarOverallProgress() {
  const list = currentDhikrList();
  const completed = list.filter((z, i) => itemCount(i) >= itemTarget(z)).length;
  return { completed, total: list.length };
}

/** First unfinished item after `from` (wrapping), or list.length when all are done. */
function nextUnfinished(from = state.azkarIndex) {
  const list = currentDhikrList();
  for (let step = 1; step <= list.length; step += 1) {
    const i = (from + step) % list.length;
    if (itemCount(i) < itemTarget(list[i])) return i;
  }
  return list.length;
}

/** The position after the last item shows the session summary. */
function onAzkarSummary() {
  const list = currentDhikrList();
  return list.length > 0 && state.azkarIndex >= list.length;
}

function fmt12(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return "";
  const [h, m] = hhmm.split(":").map(Number);
  const am = h < 12;
  const val = `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
  const period = am ? t("fmt.am") : t("fmt.pm");
  return `<span class="time-cell"><span class="time-val">${val}</span><span class="time-period">${period}</span></span>`;
}
function toMinutes(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function nextPrayer() {
  if (!prayers) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const list = PRAYER_ORDER.map((n) => ({ name: n, m: toMinutes(prayers[n]) }));
  let nextIdx = list.findIndex((p) => p.m > nowM);
  let next, prev;
  let isTomorrow = false;
  if (nextIdx === -1) {
    isTomorrow = true;
    const tomFajr = (tomorrowPrayers && tomorrowPrayers.Fajr) ? tomorrowPrayers.Fajr : prayers.Fajr;
    next = { name: "Fajr", m: toMinutes(tomFajr) + 1440 };
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
  return { name: next.name, h: Math.floor(d / 60), m: d % 60, pct, prev: prev.name, isTomorrow };
}

// ---------- geocoding ----------
function geocodeLanguage() { return state?.language === "ar" ? "ar" : "en"; }

// Resolves the device position, retrying with high accuracy.
//
// The default (low-power) mode is answered by the platform's network/fused
// location provider. That provider can stay silent indefinitely — on Android
// WebView it simply times out — so a timeout here is not a real failure. Retry
// with enableHighAccuracy, which reads the GPS provider directly.
function getCurrentPositionWithFallback() {
  const request = (options) => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

  return request({ timeout: 10000 }).catch((err) => {
    // POSITION_UNAVAILABLE (2) and TIMEOUT (3) are both worth a GPS retry;
    // PERMISSION_DENIED (1) is final, so surface it immediately.
    if (err && err.code === 1) throw err;
    return request({ timeout: 25000, enableHighAccuracy: true });
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': geocodeLanguage() } });
    const j = await r.json();
    const a = j.address || {};
    return [a.city || a.town || a.village || a.county || "", a.country || ""].filter(Boolean).join(", ") || j.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
}

// ---------- data ----------
async function loadAzkar() {
  if (AZKAR_DATA) return;
  AZKAR_DATA = globalThis.__ZAKKIR_AZKAR__;
  CATS = Object.keys(AZKAR_DATA);
  if (!CATS.includes(state.category)) state.category = CATS[0];
}

// ---------- offline prayer cache ----------
//
// The single-day `prayerCache` only rescues the day it was written on: the
// moment the date rolls over, `cache.date === today` fails and an offline
// device has nothing to fall back to. `offlinePrayerCache` instead holds a
// rolling window of whole days keyed by date, fetched a month at a time from
// the Aladhan calendar endpoint (~2.8 KB per month), so prayer times and
// notifications keep working offline across day and month boundaries.
const OFFLINE_CACHE_VERSION = 2;
const OFFLINE_CACHE_DAYS_AHEAD = 60;
const OFFLINE_CACHE_DAYS_BEHIND = 2;

function offlineCacheLocationKey() {
  return `${OFFLINE_CACHE_VERSION}|${(+state.lat).toFixed(4)}|${(+state.lng).toFixed(4)}|${state.method}`;
}

function dateKeyFor(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateKeyOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return dateKeyFor(d);
}

/** The cached day set, but only if it belongs to the current location/method. */
function offlineCacheDays() {
  const cache = state.offlinePrayerCache;
  if (!cache || cache.key !== offlineCacheLocationKey()) return null;
  return cache.days && typeof cache.days === "object" ? cache.days : null;
}

function offlineCacheEntry(dateKey) {
  const days = offlineCacheDays();
  const entry = days?.[dateKey];
  return entry && entry.timings ? entry : null;
}

/** true when the cache still reaches the end of its rolling offline window. */
function offlineCacheCoversWindow() {
  return Boolean(offlineCacheEntry(todayKey()) && offlineCacheEntry(dateKeyOffset(OFFLINE_CACHE_DAYS_AHEAD)));
}

/**
 * Fetch whole months from the Aladhan calendar endpoint and merge them into the
 * offline cache. Covers today through OFFLINE_CACHE_DAYS_AHEAD, which spans a
 * month boundary, so up to three calendar requests may run.
 */
async function refreshOfflinePrayerCache({ signal } = {}) {
  const key = offlineCacheLocationKey();
  const latR = +state.lat.toFixed(4);
  const lngR = +state.lng.toFixed(4);

  const months = new Set();
  for (let offset = -OFFLINE_CACHE_DAYS_BEHIND; offset <= OFFLINE_CACHE_DAYS_AHEAD; offset += 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  const existing = offlineCacheDays() || {};
  const merged = { ...existing };
  let added = 0;
  let lastError = null;

  for (const ym of months) {
    const [year, month] = ym.split("-").map(Number);
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latR}&longitude=${lngR}&method=${state.method}`;
    try {
      const response = await fetch(url, signal ? { signal } : undefined);
      const json = await response.json();
      if (!Array.isArray(json?.data)) throw new Error("bad calendar response");
      for (const day of json.data) {
        const gregorian = day?.date?.gregorian?.date; // DD-MM-YYYY
        if (!gregorian) continue;
        const [dd, mm, yyyy] = gregorian.split("-");
        const hj = day?.date?.hijri;
        merged[`${yyyy}-${mm}-${dd}`] = {
          timings: {
            Fajr: cleanTime(day.timings?.Fajr),
            Dhuhr: cleanTime(day.timings?.Dhuhr),
            Asr: cleanTime(day.timings?.Asr),
            Maghrib: cleanTime(day.timings?.Maghrib),
            Isha: cleanTime(day.timings?.Isha),
          },
          hijri: hj
            ? { en: `${hj.day} ${hj.month.en} ${hj.year} AH`, ar: `${hj.day} ${hj.month.ar} ${hj.year} هـ` }
            : null,
        };
        added += 1;
      }
    } catch (e) {
      // Keep what we have; a single month failing (offline, 429, etc.)
      // must not discard the other months we already fetched.
      if (e?.name === "AbortError") throw e;
      lastError = e;
    }
  }

  if (!added) throw lastError || new Error("calendar returned no days");

  // Drop days that fell out of the window so storage cannot grow without bound.
  const floor = dateKeyOffset(-OFFLINE_CACHE_DAYS_BEHIND);
  const pruned = {};
  for (const [dateKey, value] of Object.entries(merged)) {
    if (dateKey >= floor) pruned[dateKey] = value;
  }

  state.offlinePrayerCache = { key, days: pruned, fetchedAt: Date.now() };
  storage.set({ offlinePrayerCache: state.offlinePrayerCache });
}

/**
 * Populate the module-level prayer state for `dateKey` from the offline cache.
 * Returns false when the cache cannot serve that day.
 */
function applyOfflineCacheForToday() {
  const today = todayKey();
  const entry = offlineCacheEntry(today);
  if (!entry) return false;
  prayers = entry.timings;
  const tomorrow = offlineCacheEntry(dateKeyOffset(1));
  tomorrowPrayers = tomorrow ? tomorrow.timings : null;
  if (entry.hijri) hijri = entry.hijri;
  loadedPrayerDate = today;
  return true;
}

/**
 * Serve the cached day closest to today (yesterday first, then further back,
 * then the earliest future day). This covers launching offline after a day
 * (or more) has passed: slightly-old times beat a failure banner, and the
 * periodic ticker keeps retrying so this self-heals once online.
 */
function applyNearestOfflineCache() {
  const days = offlineCacheDays();
  if (!days) return false;
  const entries = Object.keys(days).filter((k) => days[k]?.timings).sort();
  if (!entries.length) return false;
  const today = todayKey();
  let bestKey = null;
  for (const k of entries) if (k <= today) bestKey = k;
  if (!bestKey) bestKey = entries[0];
  prayers = days[bestKey].timings;
  const nextKey = entries.find((k) => k > bestKey);
  tomorrowPrayers = nextKey ? days[nextKey].timings : null;
  if (days[bestKey].hijri) hijri = days[bestKey].hijri;
  // Deliberately NOT today: the stale date makes the 30s ticker re-attempt
  // loadPrayers until the network answers, then real times take over.
  loadedPrayerDate = bestKey;
  return true;
}

async function loadPrayers(force = false) {
  if (!state.locationSet) return;
  const today = todayKey();
  const cache = state.prayerCache;
  const latR = +state.lat.toFixed(4);
  const lngR = +state.lng.toFixed(4);

  // Offline-first: if the rolling cache already covers today, render from it
  // straight away. Nothing below needs the network to show correct times.
  const servedFromOfflineCache = applyOfflineCacheForToday();
  if (servedFromOfflineCache) {
    lastErr = null;
    offlinePrayerNotice = false;
    usingCachedPrayers = false;
    syncReminders();
    applyAutoAzkarCategory();
    // Still top the window back up in the background, but only when it is
    // actually running low — no request at all on a normal offline launch.
    if (!offlineCacheCoversWindow() || force) {
      refreshOfflinePrayerCache().then(() => {
        if (applyOfflineCacheForToday()) syncReminders();
      }).catch(() => {
        offlinePrayerNotice = true;
        patchPrayerCard();
      });
    }
    return;
  }

  if (
    !force && cache &&
    cache.date === today &&
    +cache.lat === latR && +cache.lng === lngR &&
    cache.method === state.method
  ) {
    prayers = cache.timings;
    tomorrowPrayers = cache.tomorrowTimings || null;
    hijri = cache.hijri;
    loadedPrayerDate = today;
    syncReminders();
    // Reaching here means the rolling cache doesn't cover today (missing,
    // or for another location/method), so the notification window would
    // only have today. Fill it in the background and reschedule.
    refreshOfflinePrayerCache().then(() => {
      if (applyOfflineCacheForToday()) syncReminders();
    }).catch(() => {});
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const requestId = ++prayerLoadSequence;
  try {
    // One calendar request covers a whole month, so this both renders today and
    // fills the offline window for the days ahead.
    await refreshOfflinePrayerCache({ signal: controller.signal });
    if (requestId !== prayerLoadSequence) return;
    if (!applyOfflineCacheForToday()) throw new Error("calendar missing today");
    state.prayerCache = { date: today, lat: latR, lng: lngR, method: state.method, timings: prayers, tomorrowTimings: tomorrowPrayers, hijri };
    storage.set({ prayerCache: state.prayerCache });
    lastErr = null;
    offlinePrayerNotice = false;
    usingCachedPrayers = false;
    // send to main process for reminder scheduling
    syncReminders();
    applyAutoAzkarCategory();
  } catch (e) {
    if (requestId !== prayerLoadSequence) return;
    // Offline or API failure. Prefer the rolling cache, then the legacy
    // single-day cache, so the app still works with no internet.
    if (applyOfflineCacheForToday()) {
      usingCachedPrayers = false;
      lastErr = null;
      offlinePrayerNotice = true;
      syncReminders();
      applyAutoAzkarCategory();
    } else if (applyNearestOfflineCache()) {
      // A day (or more) passed while offline: serve the closest cached day
      // with the subtle offline note instead of the red failure banner.
      usingCachedPrayers = true;
      lastErr = null;
      offlinePrayerNotice = true;
      syncReminders();
      applyAutoAzkarCategory();
    } else if (cache && cache.timings && cache.date === today) {
      prayers = cache.timings;
      tomorrowPrayers = cache.tomorrowTimings || null;
      hijri = cache.hijri;
      loadedPrayerDate = today;
      usingCachedPrayers = true;
      offlinePrayerNotice = false;
      syncReminders();
      applyAutoAzkarCategory();
      lastErr = t("prayers.stale");
    } else if (state.offlinePrayerCache?.days?.[today]?.timings) {
      // Last resort: stale rolling cache from a previous location/method.
      // Better to show slightly wrong times than "Unavailable" when the user
      // just turned wifi off. The stale banner makes the fallback explicit.
      const stale = state.offlinePrayerCache.days[today];
      prayers = stale.timings;
      tomorrowPrayers = state.offlinePrayerCache.days[dateKeyOffset(1)]?.timings || null;
      hijri = stale.hijri;
      loadedPrayerDate = today;
      usingCachedPrayers = true;
      offlinePrayerNotice = false;
      syncReminders();
      applyAutoAzkarCategory();
      lastErr = t("prayers.stale");
    } else {
      usingCachedPrayers = false;
      offlinePrayerNotice = false;
      lastErr = t("err.prayers");
    }
  } finally {
    clearTimeout(timeout);
  }
}

function hijriLabel() {
  if (!hijri) return "";
  if (typeof hijri === "string") return hijri;
  return isArabic() ? hijri.ar : hijri.en;
}

function syncReminders() {
  if (!prayers || !state.locationSet) return;
  // Hand the native scheduler the pre-fetched upcoming days as well. Without
  // them it has to call the network itself, which is exactly what fails
  // offline and leaves stale notifications scheduled.
  const upcoming = {};
  const days = offlineCacheDays();
  if (days) {
    for (let offset = 0; offset <= OFFLINE_CACHE_DAYS_AHEAD; offset += 1) {
      const dateKey = dateKeyOffset(offset);
      const entry = days[dateKey];
      if (entry?.timings) upcoming[dateKey] = entry.timings;
    }
  }
  ZakkirNative.scheduleNotifications(prayers, {
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
    language: state.language,
    upcomingTimings: upcoming,
  });
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
    state.azkarCount = itemCount(0);
    storage.set({ category: targetCat, azkarIndex: 0, azkarCount: state.azkarCount });
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
    state.azkarCounts = {};
    storage.set({ azkarResetDate: today, azkarIndex: 0, azkarCount: 0, azkarCounts: {} });
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
  undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>`,
};

// ---------- views ----------
function mobileBottomNavHTML(active) {
  const order = ["home", "schedule", "settings"];
  const destinationIndex = Math.max(0, order.indexOf(active));
  const originIndex = mobileNavTransition?.to === destinationIndex
    ? mobileNavTransition.from
    : destinationIndex;
  const navLabels = { home: t("nav.home"), schedule: t("nav.schedule"), settings: t("nav.settings") };
  return `<nav class="mobile-bottom-nav" aria-label="${t("nav.primary")}">
    <i class="mobile-nav-liquid" aria-hidden="true" style="--nav-index:${originIndex}"></i>
    <button type="button" class="mobile-bottom-nav-btn ${active === "home" ? "active" : ""}" data-go="home" aria-label="${navLabels.home}" ${active === "home" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.home}</span><span class="mobile-nav-label">${navLabels.home}</span></button>
    <button type="button" class="mobile-bottom-nav-btn ${active === "schedule" ? "active" : ""}" data-go="schedule" aria-label="${navLabels.schedule}" ${active === "schedule" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.cal}</span><span class="mobile-nav-label">${navLabels.schedule}</span></button>
    <button type="button" class="mobile-bottom-nav-btn ${active === "settings" ? "active" : ""}" data-go="settings" aria-label="${navLabels.settings}" ${active === "settings" ? `aria-current="page"` : ""}><span class="mobile-nav-icon">${icon.gear}</span><span class="mobile-nav-label">${navLabels.settings}</span></button>
  </nav>`;
}

function arabicPlural(n, one, dual, few) {
  if (n === 1) return one;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return few;
  return one;
}
function arabicDuration(h, m) {
  const parts = [];
  if (h > 0) { const p = arabicPlural(h, "ساعة", "ساعتان", "ساعات"); parts.push(h <= 2 ? p : `${h} ${p}`); }
  if (m > 0) { const p = arabicPlural(m, "دقيقة", "دقيقتان", "دقائق"); parts.push(m <= 2 ? p : `${m} ${p}`); }
  return parts.join(" و");
}
function durText(hrs, mins) {
  if (isArabic()) return arabicDuration(hrs, mins);
  return hrs > 0 ? `${hrs}${t("time.h")} ${mins}${t("time.m")}` : `${mins}${t("time.m")}`;
}

/** "in 1h 05m" / "in 50m" / "بعد ساعة و5 دقائق" for the next-prayer countdown. */
function countdownHTML(np) {
  return `<span class="next-in">${t("prayer.in")}</span> ${isArabic() ? `<strong class="countdown-ar">${arabicDuration(np.h, np.m)}</strong>` : `${np.h > 0 ? `<strong>${np.h}<small>${t("time.h")}</small></strong> ` : ""}<strong>${np.h > 0 ? String(np.m).padStart(2, "0") : np.m}<small>${t("time.m")}</small></strong>`}`;
}

function prayerCardHTML() {
  const np = nextPrayer();
  const nextName = np ? prayerName(np.name) : (lastErr ? t("prayer.unavailable") : t("prayer.loading"));
  const collapsed = Boolean(state.prayerCollapsed);
  const toggleLabel = collapsed ? t("prayer.show") : t("prayer.minimize");
  // The head is PERSISTENT across collapse/expand: the same name and
  // countdown nodes stay mounted and only change size, so the text genuinely
  // morphs between states instead of two copies cross-fading. "Fajr, in 1h 5m"
  // says which prayer is next without a separate label.
  return `
    <div class="prayer-head">
      <div class="next-line">
        <span class="hijri">${hijriLabel() || ""}</span>
        <button type="button" class="prayer-collapse" aria-label="${toggleLabel}" aria-expanded="${!collapsed}" title="${toggleLabel}">${icon.chevronDown}</button>
      </div>
      <div class="next-prayer">
        <div class="next-name">${nextName}${np && !isArabic() ? `<span class="next-name-ar" lang="ar" aria-hidden="true">${PRAYER_NAMES[np.name] || ""}</span>` : ""}</div>
        ${np ? `<div class="next-countdown">${countdownHTML(np)}</div>` : ""}
      </div>
    </div>
    <div class="prayer-expanded-content" ${collapsed ? "inert" : ""}>
      <div class="prayer-expanded-inner">
      ${np ? `<div class="prayer-progress" title="${prayerName(np.prev)} → ${prayerName(np.name)}"><div style="transform:scaleX(${np.pct / 100})"></div></div>` : ""}
      <div class="prayer-grid">
        ${PRAYER_ORDER.map((name) => {
          const isCurrent = np && np.name === name;
          const isTap = activePrayer === name;
          const useTomorrow = isCurrent && np.isTomorrow && tomorrowPrayers && tomorrowPrayers[name];
          const pt = prayers ? fmt12(useTomorrow ? tomorrowPrayers[name] : prayers[name]) : "—";
          const cls = ["prayer"];
          if (isCurrent) cls.push("current");
          if (isTap) cls.push("tapped");
          return `<button type="button" class="${cls.join(" ")}" data-prayer="${name}"><div class="n">${prayerName(name)}</div><div class="t">${pt}</div></button>`;
        }).join("")}
      </div>
      <div class="prayer-detail" id="prayerDetail">${activePrayer ? detailHTML(activePrayer) : ""}</div>
      </div>
    </div>
    ${lastErr ? `<div class="err">${lastErr}</div>` : offlinePrayerNotice ? `<div class="offline-notice" role="status">${t("prayers.offline")}</div>` : ""}`;
}

function wirePrayerCollapse() {
  // One persistent toggle now, so a class-only change on the card drives the
  // whole morph (name/countdown size, hijri fade, content height, chevron).
  document.querySelectorAll(".prayer-collapse").forEach((button) => {
    if (button.dataset.wired) return;
    button.dataset.wired = "1";
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      state.prayerCollapsed = !state.prayerCollapsed;
      storage.set({ prayerCollapsed: state.prayerCollapsed });
      ZakkirNative.haptic("selection");
      const collapsed = Boolean(state.prayerCollapsed);
      const label = collapsed ? t("prayer.show") : t("prayer.minimize");
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      $("#prayerRegion")?.classList.toggle("is-collapsed", collapsed);
      // Hidden prayer buttons must leave the focus order and accessibility tree.
      $("#prayerRegion .prayer-expanded-content")?.toggleAttribute("inert", collapsed);
    });
  });
}

function detailHTML(name) {
  if (!prayers || !prayers[name]) return "";
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  let prayerTime = prayers[name];
  let prayerM = toMinutes(prayerTime);
  let isPast = prayerM <= nowM;

  if (name === "Fajr" && nowM > toMinutes(prayers.Isha)) {
    if (tomorrowPrayers && tomorrowPrayers.Fajr) {
      prayerTime = tomorrowPrayers.Fajr;
    }
    prayerM = toMinutes(prayerTime) + 1440;
    isPast = false;
  }

  const diff = prayerM - nowM;
  const absDiff = Math.abs(diff);
  const hrs = Math.floor(absDiff / 60);
  const mins = absDiff % 60;
  const timeStr = durText(hrs, mins);
  const nextIdx = (PRAYER_ORDER.indexOf(name) + 1) % PRAYER_ORDER.length;
  const nextName = PRAYER_ORDER[nextIdx];
  const nextTime = prayers[nextName] ? fmt12(prayers[nextName]) : "";
  return `
    <div class="detail-inner">
      <span class="detail-name">${prayerName(name)}</span>
      <span class="detail-time">${isPast ? t("time.ago", { time: timeStr }) : t("time.in", { time: timeStr })}</span>
      ${nextTime ? `<span class="detail-next">${t("detail.next", { name: prayerName(nextName), time: nextTime })}</span>` : ""}
    </div>`;
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

/** "Fajr · 5:23 AM" style start of the next azkar session. */
function nextSessionLine(morning) {
  const prayer = morning ? "Maghrib" : "Fajr";
  const time = prayers?.[prayer] ? fmt12(prayers[prayer]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
  return t(morning ? "azkar.nextEvening" : "azkar.nextMorning", { time });
}

function azkarSummaryHTML() {
  const { completed, total } = azkarOverallProgress();
  const done = total > 0 && completed === total;
  const morning = state.category === MORNING_CAT;
  return `
    <div class="azkar-summary${done ? " is-done" : ""}" aria-live="polite">
      <div class="azkar-summary-title" lang="ar">${morning ? "أذكار الصباح" : "أذكار المساء"}</div>
      <div class="azkar-summary-state">${done ? t("azkar.done") : t("azkar.partial", { completed, total })}</div>
      ${done ? `<div class="azkar-summary-dua"><span lang="ar">تقبّل الله</span>${isArabic() ? "" : `<small>${t("azkar.accept")}</small>`}</div>` : ""}
      <div class="azkar-progress-track" role="progressbar" aria-label="${t("azkar.overall.aria")}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${completed}"><div style="transform:scaleX(${total ? completed / total : 0})"></div></div>
      <div class="azkar-summary-next">${nextSessionLine(morning)}</div>
      <div class="azkar-summary-action">${done ? t("azkar.review") : t("azkar.continue")}</div>
    </div>`;
}

function azkarCardHTML() {
  if (onAzkarSummary()) return azkarSummaryHTML();
  const list = currentDhikrList();
  const z = list[state.azkarIndex] || { content: "—", count: "1", description: "" };
  const target = parseInt(z.count, 10) || 1;
  const pct = Math.min(100, (state.azkarCount / target) * 100);
  const overall = azkarOverallProgress();
  const overallPct = overall.total ? Math.min(100, (overall.completed / overall.total) * 100) : 0;
  const reading = splitOpeningFormula(z.content);
  const morning = state.category === MORNING_CAT;
  return `
    <div class="azkar-context ${morning ? "is-morning" : "is-evening"}" aria-live="polite">
      <span class="azkar-context-balance" aria-hidden="true"></span>
      <div class="azkar-context-copy"><strong lang="ar">${morning ? "أذكار الصباح" : "أذكار المساء"}</strong></div>
      <span class="counter azkar-current-count" aria-label="${t("azkar.current.aria")}">${state.azkarCount} / ${target}</span>
    </div>
    <div class="progress azkar-current-progress" aria-hidden="true"><div style="transform:scaleX(${pct / 100})"></div></div>
    <div class="azkar-body-wrapper">
      ${reading.preamble ? `<div class="dhikr-preamble dhikr-preamble-${reading.preambleKind}" lang="ar">${reading.preamble}</div>` : ""}
      <div class="dhikr" lang="ar">${reading.body}</div>
      ${z.description ? `<div class="desc">${z.description}</div>` : ""}
    </div>
    <div class="azkar-progress-footer">
      ${!state.azkarHintDismissed ? `<div class="azkar-progress-label azkar-hint"><span>${t("azkar.tapHint")}</span></div>` : ""}
      <div class="azkar-progress-label"><span>${t("azkar.overall")}</span><strong class="azkar-progress-count">${overall.completed} / ${overall.total}</strong></div>
      <div class="azkar-progress-track" role="progressbar" aria-label="${t("azkar.overall.aria")}" aria-valuemin="0" aria-valuemax="${overall.total}" aria-valuenow="${overall.completed}"><div style="transform:scaleX(${overallPct / 100})"></div></div>
    </div>`;
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
      <section class="card prayer-card ${state.prayerCollapsed ? "is-collapsed" : ""}" id="prayerRegion" aria-label="${t("prayer.times")}">${prayerCardHTML()}</section>
      <button type="button" class="azkar-card${onAzkarSummary() ? " is-summary" : ""}" id="azkarTap" aria-describedby="azkarCountHint">${azkarCardHTML()}</button>
      <span class="sr-only" id="azkarCountHint">${t("azkar.countHint")}</span>
      <div class="nav-row azkar-controls" data-nav-mode="${navMode}">
        <button class="nav-btn" data-nav="-1" title="${t("azkar.prev.title")}">${icon.prev}<span>${t("azkar.prev")}</span></button>
        <button class="nav-btn reset-btn" id="resetBtn" title="${t("azkar.undo.title")}" aria-label="${t("azkar.undo.title")}">${icon.undo}<span>${t("azkar.undo")}</span></button>
        <button class="nav-btn" data-nav="1" title="${t("azkar.next.title")}"><span>${t("azkar.next")}</span>${icon.next}</button>
      </div>
      ${mobileBottomNavHTML("home")}
    </div>
  `;
}

// ---------- Monthly schedule ----------
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function monthName(index) {
  const m = MONTH_NAMES_AR[index] ?? MONTH_NAMES[index] ?? "";
  return isArabic() ? m : (MONTH_NAMES[index] ?? "");
}
const WEEKDAYS_AR = {
  Sunday: "الأحد", Monday: "الاثنين", Tuesday: "الثلاثاء", Wednesday: "الأربعاء",
  Thursday: "الخميس", Friday: "الجمعة", Saturday: "السبت",
};
function weekdayName(day) {
  if (!day) return "";
  return isArabic() ? (WEEKDAYS_AR[day] || day) : day;
}

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
const HIJRI_EVENTS_AR = {
  "1|1": "رأس السنة الهجرية",
  "1|10": "يوم عاشوراء",
  "3|12": "المولد النبوي",
  "7|27": "الإسراء والمعراج",
  "8|15": "النصف من شعبان",
  "9|1": "أول رمضان",
  "9|27": "ليلة القدر (المرجّحة)",
  "10|1": "عيد الفطر",
  "12|9": "يوم عرفة",
  "12|10": "عيد الأضحى",
};
function hijriEventName(hMonthNum, hDay) {
  const key = `${Number(hMonthNum)}|${Number(hDay)}`;
  if (!HIJRI_EVENTS[key]) return "";
  return isArabic() ? HIJRI_EVENTS_AR[key] : HIJRI_EVENTS[key];
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
    if (_scheduleData) _scheduleData.error = t("sched.error");
    if (_scheduleData) _scheduleData.loading = false;
    if (!_scheduleData?.days) _scheduleData = { ym, key, days: null, error: t(navigator.onLine === false ? "sched.errorOffline" : "sched.errorShort"), loading: false };
  } finally {
    _scheduleLoadingKey = null;
    if (state.view === "schedule") patchSchedule();
  }
}

function scheduleHeaderHTML() {
  const ym = currentScheduleYM();
  const [y, m] = ym.split("-").map(Number);
  const monthNameL = monthName(m - 1);
  // Hijri label: derive a range from first/last day so month transitions are visible.
  let hijriLabel = "";
  const days = _scheduleData?.days || [];
  if (days.length) {
    const first = days[0];
    const last = days[days.length - 1];
    if (first?.hMonth && last?.hMonth) {
      const firstH = isArabic() && first.hMonthAr ? first.hMonthAr : first.hMonth;
      const lastH = isArabic() && last.hMonthAr ? last.hMonthAr : last.hMonth;
      const ah = t("sched.ah");
      if (first.hMonth === last.hMonth && first.hYear === last.hYear) {
        hijriLabel = `${firstH} ${first.hYear} ${ah}`;
      } else {
        const yA = first.hYear, yB = last.hYear;
        hijriLabel = yA === yB
          ? `${firstH} → ${lastH} ${yB} ${ah}`
          : `${firstH} ${yA} → ${lastH} ${yB} ${ah}`;
      }
    }
  }
  const mode = state.scheduleDateMode === "h" ? "h" : "g";
  return `
    <div class="sched-head">
      <button class="icon-btn" id="schedPrev" title="${t("sched.prevMonth")}">${icon.prev}</button>
      <div class="sched-title">
        <div class="sched-month">${monthNameL} ${y}</div>
        ${hijriLabel ? `<div class="sched-hijri">${hijriLabel}</div>` : ""}
      </div>
      <button class="icon-btn" id="schedNext" title="${t("sched.nextMonth")}">${icon.next}</button>
    </div>
    <div class="sched-mode" role="tablist">
      <button class="sched-mode-btn ${mode === "g" ? "active" : ""}" data-mode="g" role="tab">${t("sched.gregorian")}</button>
      <button class="sched-mode-btn ${mode === "h" ? "active" : ""}" data-mode="h" role="tab">${t("sched.hijri")}</button>
    </div>`;
}

function scheduleBodyHTML() {
  if (_scheduleData?.error && !_scheduleData?.days) {
    return `<div class="sched-msg">${_scheduleData.error} <button class="loc-btn" id="schedRetry">${t("sched.retry")}</button></div>`;
  }
  if (!_scheduleData?.days) {
    return `<div class="sched-msg">${t("sched.loading")}</div>`;
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
    const fastTitle = wd === "monday" ? t("sched.fast.monday") : t("sched.fast.thursday");
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
      const hMonthL = isArabic() && d.hMonthAr ? d.hMonthAr : d.hMonth;
      const hijriMain = d.hDay
        ? (rollover
            ? `<b>${d.hDay}</b><span class="wd">${hMonthL} ${d.hYear}</span>`
            : `<b>${d.hDay}</b><span class="wd">${(hMonthL || "").slice(0, 8)}</span>`)
        : "";
      dateCell = `<td class="d h-primary">${hijriMain}${evtBadge}${fastBadge}</td>`;
    } else {
      dateCell = `<td class="d"><b>${d.g}</b><span class="wd">${weekdayName(d.weekday || "").slice(0, isArabic() ? 14 : 3)}</span>${evtBadge}${fastBadge}</td>`;
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
  const dateHeader = mode === "h" ? t("sched.hijri") : t("sched.dateHeader");
  return `
    <div class="sched-table-wrap">
      <table class="sched-table">
        <thead><tr><th>${dateHeader}</th><th>${prayerName("Fajr")}</th><th>${prayerName("Dhuhr")}</th><th>${prayerName("Asr")}</th><th>${prayerName("Maghrib")}</th><th>${prayerName("Isha")}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${_scheduleData.loading ? `<div class="sched-msg subtle">${t("sched.updating")}</div>` : ""}`;
}

function scheduleFooterHTML() {
  const where = state.locationName || `${Number(state.lat).toFixed(2)}, ${Number(state.lng).toFixed(2)}`;
  const methodNameL = methodName(state.method);
  return `
    <div class="sched-foot">
      <span>${where} · ${methodNameL}</span>
    </div>
    <div class="settings-card sched-option"><div class="row"><label for="sunnahFastHighlight">${t("loc.sunnahFast")}</label><label class="switch"><input type="checkbox" id="sunnahFastHighlight" ${state.sunnahFastHighlight ? "checked" : ""}/><span></span></label></div></div>`;
}

function renderSchedule() {
  return `
    <div class="app">
      <div class="settings-head">
        <button type="button" class="icon-btn" data-go="home" aria-label="${t("nav.back")}">${icon.back}</button>
        <h1>${t("sched.title")}</h1>
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

// Month navigation: slide the table in from the direction of travel so the
// change reads as movement through time rather than a flicker. Background data
// arrival still uses the silent patchSchedule() above.
function patchScheduleDirectional(delta) {
  patchSchedule();
  const body = $("#schedBody");
  if (body) playEnter(body, delta < 0 ? "slideInFromStart" : "slideInFromEnd");
}

function wireSchedule() {
  const sf = $("#sunnahFastHighlight");
  if (sf) sf.addEventListener("change", (e) => {
    state.sunnahFastHighlight = e.target.checked;
    storage.set({ sunnahFastHighlight: state.sunnahFastHighlight });
    const body = $("#schedBody"); if (body) setHTML(body, scheduleBodyHTML());
  });
  const prev = $("#schedPrev");
  if (prev) prev.addEventListener("click", () => {
    state.scheduleMonth = stepScheduleMonth(-1);
    storage.set({ scheduleMonth: state.scheduleMonth });
    fetchMonth(state.scheduleMonth);
    patchScheduleDirectional(-1);
  });
  const next = $("#schedNext");
  if (next) next.addEventListener("click", () => {
    state.scheduleMonth = stepScheduleMonth(1);
    storage.set({ scheduleMonth: state.scheduleMonth });
    fetchMonth(state.scheduleMonth);
    patchScheduleDirectional(1);
  });
  const retry = $("#schedRetry");
  if (retry) retry.addEventListener("click", () => { fetchMonth(currentScheduleYM()); patchSchedule(); });
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
function presetForCoords() {
  for (const [country, cities] of Object.entries(PRESETS)) {
    for (const [city, coords] of Object.entries(cities)) {
      if (Math.abs(coords[0] - state.lat) < 0.001 && Math.abs(coords[1] - state.lng) < 0.001) return { country, city };
    }
  }
  return { country: "", city: "" };
}

// The stored place name is text in whichever language was active when it was
// chosen. After a language switch, re-derive it so "Cairo, Egypt" does not sit
// in an Arabic screen.
async function relocalizeLocationName() {
  if (!state.locationSet) return;
  let name = "";
  const { country, city } = presetForCoords();
  if (state.locationMethod === "preset" && country) {
    name = `${presetCityLabel(country, city)}, ${presetCountryLabel(country)}`;
  } else if (state.locationMethod === "detect") {
    name = await reverseGeocode(state.lat, state.lng);
  }
  if (!name || name === state.locationName) return;
  state.locationName = name;
  storage.set({ locationName: name });
  if (state.view === "settings" && state.settingsSection === "general") patchLocation();
  else if (state.view === "schedule") patchSchedule();
}

function locationCardHTML() {
  const method = state.locationMethod || "manual";
  const srcLabel = {
    preset: t("loc.viaPreset"),
    detect: t("loc.viaGps"),
    manual: "",
  }[method] || "";
  const resolved = !state.locationSet ? t("loc.notSet") : (state.locationName || `${Number(state.lat).toFixed(3)}, ${Number(state.lng).toFixed(3)}`);
  const locationTabs = [["gps", t("loc.gps")], ["city", t("loc.city")]];
  const tab = locationTabs.some(([id]) => id === state.locationTab)
    ? state.locationTab
    : (method === "detect" ? "gps" : "city");

  const { country: activeCountry, city: activeCity } = presetForCoords();

  const panel =
    tab === "gps"
      ? `<div class="loc-panel">
          <button class="loc-btn primary" id="detectBtn">${t("loc.detect")}</button>
          <div class="loc-sub">${t("loc.detect.sub")}</div>
        </div>`
      : `<div class="loc-panel">
          <div class="row">
            <label for="presetCountry">${t("loc.country")}</label>
            <select id="presetCountry">
              <option value="">${t("loc.selectCountry")}</option>
              ${Object.keys(PRESETS).map((c) => `<option value="${c}" ${c === activeCountry ? "selected" : ""}>${presetCountryLabel(c)}</option>`).join("")}
            </select>
          </div>
          <div class="row">
            <label for="presetCity">${t("loc.city")}</label>
            <select id="presetCity">
              <option value="">${t("loc.selectCity")}</option>
              ${activeCountry ? Object.keys(PRESETS[activeCountry]).map((c) => `<option value="${c}" ${c === activeCity ? "selected" : ""}>${presetCityLabel(activeCountry, c)}</option>`).join("") : ""}
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
  confirmLocation();
}

// Any location the user picks counts as chosen; until then the app asks
// instead of quietly showing Cairo's prayer times.
function confirmLocation() {
  if (!state.locationSet) {
    state.locationSet = true;
    storage.set({ locationSet: true });
  }
  const next = $("#welcomeContinue");
  if (next) next.disabled = false;
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
    detect.textContent = t("loc.detecting");
    detect.disabled = true;
    try {
      const pos = await getCurrentPositionWithFallback();
      const lat = +pos.coords.latitude.toFixed(4);
      const lng = +pos.coords.longitude.toFixed(4);
      const name = await reverseGeocode(lat, lng);
      state.lat = lat; state.lng = lng; state.locationName = name; state.locationMethod = "detect"; state.locationTab = "gps";
      storage.set({ lat, lng, locationName: name, locationMethod: "detect", locationTab: "gps", prayerCache: null });
      patchLocation();
      await loadPrayers(true);
      patchPrayerCard();
    } catch {
      detect.textContent = t("loc.failed");
      detect.disabled = false;
    }
  });
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
      state.locationName = `${presetCityLabel(country, city)}, ${presetCountryLabel(country)}`;
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
      presetCity.innerHTML = `<option value="">${t("loc.selectCity")}</option>`;
      if (country && PRESETS[country]) {
        Object.keys(PRESETS[country]).forEach((city) => {
          const opt = document.createElement("option");
          opt.value = city;
          opt.textContent = presetCityLabel(country, city);
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
  return themes.map(([id]) => `
    <button class="theme-card ${featured ? "theme-featured" : ""} ${state.theme === id ? "active" : ""}" data-theme="${id}">
      <div class="sw" data-theme-sw="${id}"></div><span class="theme-name">${themeName(id)}</span>
    </button>`).join("");
}

const SETTINGS_SECTIONS = ["general", "reading", "appearance", "notifications"];

function settingsSectionHTML(id, title, description, body) {
  return `<section class="settings-section" data-settings-panel="${id}">
    <div class="settings-section-intro"><div class="sec">${title}</div><p>${description}</p></div>
    ${body}
  </section>`;
}

function prayerMinute(map, prayer, fallback) {
  return Math.min(60, Math.max(1, Number(map?.[prayer]) || fallback));
}

function minuteFieldHTML(attrs, value, label, disabled) {
  return `<span class="minute-field ${disabled ? "is-disabled" : ""}"><input type="number" inputmode="numeric" min="1" max="60" step="1" value="${value}" ${attrs} aria-label="${label}" ${disabled ? "disabled" : ""}/><small>${t("notify.min")}</small></span>`;
}

function prayerTimingHTML(prayer, disabled) {
  const before = prayerMinute(state.reminderMinutesByPrayer, prayer, state.reminderMinutes);
  const after = prayerMinute(state.iqamaMinutesByPrayer, prayer, state.iqamaMinutes);
  const beforeOff = disabled || !state.remindersEnabled;
  const afterOff = disabled || !state.iqamaEnabled;
  const name = prayerName(prayer);
  return `<div class="prayer-timing-row" data-prayer-timing="${prayer}"><strong>${name}</strong><label class="minute-group ${beforeOff ? "is-disabled" : ""}"><span>${t("notify.beforeLbl")}</span>${minuteFieldHTML('data-prayer-minutes="before"', before, t("notify.beforeMin", { prayer: name }), beforeOff)}</label><label class="minute-group ${afterOff ? "is-disabled" : ""}"><span>${t("notify.afterLbl")}</span>${minuteFieldHTML('data-prayer-minutes="after"', after, t("notify.afterMin", { prayer: name }), afterOff)}</label></div>`;
}

function prayerChipHTML(prayer, disabled) {
  const on = (state.reminderPrayers || []).includes(prayer);
  return `<label class="sound-option prayer-chip ${on ? "active" : ""}"><input type="checkbox" class="sr-only" data-rp="${prayer}" ${on ? "checked" : ""} ${disabled ? "disabled" : ""}/>${prayerName(prayer)}</label>`;
}

function notificationSummary() {
  if (!state.notificationsEnabled) return t("notify.paused");
  const prayers = (state.reminderPrayers || []).filter((prayer) => PRAYER_ORDER.includes(prayer));
  if (!prayers.length) return t("notify.chooseOne");
  const prayerText = prayers.length === PRAYER_ORDER.length
    ? t("notify.allFive")
    : humanList(prayers.map((p) => prayerName(p)));
  const events = [];
  if (state.remindersEnabled) events.push(t("notify.evt.before"));
  if (state.prayerAlertEnabled) events.push(t("notify.evt.at"));
  if (state.iqamaEnabled) events.push(t("notify.evt.after"));
  if (!events.length) return t("notify.chooseWhen");
  const eventsText = isArabic() ? humanList(events) : events.join(", ");
  return t("notify.willBe", { events: eventsText, prayers: prayerText });
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

  const beforeOff = !enabled || !state.remindersEnabled;
  const afterOff = !enabled || !state.iqamaEnabled;

  document.querySelectorAll("[data-rp]").forEach((input) => {
    const active = (state.reminderPrayers || []).includes(input.dataset.rp);
    input.checked = active;
    input.disabled = !enabled;
    input.closest(".prayer-chip")?.classList.toggle("active", active);
  });
  const beforeAll = $("#reminderMinutesAll");
  if (beforeAll) { beforeAll.disabled = beforeOff; beforeAll.closest(".minute-field")?.classList.toggle("is-disabled", beforeOff); }
  const afterAll = $("#iqamaMinutesAll");
  if (afterAll) { afterAll.disabled = afterOff; afterAll.closest(".minute-field")?.classList.toggle("is-disabled", afterOff); }
  document.querySelectorAll('[data-prayer-minutes="before"]').forEach((input) => {
    input.disabled = beforeOff;
    input.closest(".minute-group")?.classList.toggle("is-disabled", beforeOff);
  });
  document.querySelectorAll('[data-prayer-minutes="after"]').forEach((input) => {
    input.disabled = afterOff;
    input.closest(".minute-group")?.classList.toggle("is-disabled", afterOff);
  });
  document.querySelectorAll("[data-prayer-action]").forEach((button) => { button.disabled = !enabled; });
  const summary = document.querySelector(".notification-confirmation p");
  if (summary) summary.textContent = notificationSummary();
  document.querySelector(".notification-confirmation")?.classList.toggle("paused", !enabled);
}

const SOUND_CATALOG = [
  ["adhan-1", "Adhan 1"],
  ["adhan-2", "Adhan 2"],
  ["chime", "Chime"],
  ["soft-ping", "Soft Ping"],
  ["silent", "Silent"],
];
// The mobile renderer inlines only the sounds its build bundles (the Android
// app omits the adhan recordings until their rights are cleared), so offer just
// those there. Other builds load sounds/ by URL and get the full catalogue.
const SOUNDS = globalThis.__ZAKKIR_SOUNDS__
  ? SOUND_CATALOG.filter(([id]) => id === "silent" || id in globalThis.__ZAKKIR_SOUNDS__)
  : SOUND_CATALOG;
const SOUND_NAMES_AR = {
  "adhan-1": "الأذان 1",
  "adhan-2": "الأذان 2",
  chime: "رنين",
  "soft-ping": "نغمة خفيفة",
  silent: "صامت",
};
function soundName(id) {
  if (!isArabic()) return (SOUNDS.find(([s]) => s === id) || ["", id])[1];
  return SOUND_NAMES_AR[id] || (SOUNDS.find(([s]) => s === id) || ["", id])[1];
}

function settingsBodyHTML(id) {
  if (id === "general") return `
    <div id="locRegion">${locationCardHTML()}</div>
    <details class="loc-adv" ${state.locationAdvancedOpen ? "open" : ""}>
      <summary>${t("loc.advanced")}</summary>
      <div class="row"><label>${t("loc.latitude")}</label><input class="input" id="latInput" type="number" step="0.0001" placeholder="${t("loc.latPh")}" value="${state.lat?.toFixed ? state.lat.toFixed(4) : ""}" /></div>
      <div class="row"><label>${t("loc.longitude")}</label><input class="input" id="lngInput" type="number" step="0.0001" placeholder="${t("loc.lngPh")}" value="${state.lng?.toFixed ? state.lng.toFixed(4) : ""}" /></div>
      <button class="loc-btn" id="useCoordsBtn" style="width:100%;margin:2px 0 8px">${t("loc.useCoords")}</button>
    </details>
    <div class="settings-card"><div class="row"><label>${t("loc.method")}</label>${dropdownHTML("method", state.method, METHODS.map(([v]) => ({ v, l: methodName(v) })))}</div>
      <div class="row"><label>${t("lang.label")}</label><div class="seg" role="group" aria-label="${t("lang.label")}"><button class="seg-btn ${state.language === "en" ? "active" : ""}" data-language="en">${t("lang.en")}</button><button class="seg-btn ${state.language === "ar" ? "active" : ""}" data-language="ar">${t("lang.ar")}</button></div></div>
      ${isArabic() ? `<div class="row"><label>${t("lang.digits")}</label><div class="seg" role="group" aria-label="${t("lang.digits")}"><button class="seg-btn ${!state.arabicDigits ? "active" : ""}" data-digits="latin" dir="ltr">123</button><button class="seg-btn ${state.arabicDigits ? "active" : ""}" data-digits="arabic">١٢٣</button></div></div>` : ""}
    </div>`;
  if (id === "notifications") {
    const notificationsOff = !state.notificationsEnabled;
    return `
    <div class="notification-master settings-card"><div><strong>${t("notify.master")}</strong><span>${t("notify.master.sub")}</span></div><label class="switch"><input aria-label="${t("notify.master")}" type="checkbox" id="notificationsEnabled" ${state.notificationsEnabled ? "checked" : ""}/><span></span></label></div>
    <div class="notification-config ${notificationsOff ? "is-paused" : ""}" aria-disabled="${notificationsOff}">
      <div class="notification-block settings-card"><div class="notification-block-head"><div><strong>${t("notify.reminders")}</strong></div></div>
        <div class="athan-line"><div class="athan-copy"><strong>${t("notify.before")}</strong><span>${t("notify.before.sub")}</span></div>${minuteFieldHTML('id="reminderMinutesAll"', prayerMinute(null, "", state.reminderMinutes), t("notify.beforeAll"), notificationsOff || !state.remindersEnabled)}<label class="switch"><input aria-label="${t("notify.aria.before")}" type="checkbox" id="remindersEnabled" ${state.remindersEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        <div class="athan-line"><div class="athan-copy"><strong>${t("notify.at")}</strong><span>${t("notify.at.sub")}</span></div><label class="switch"><input aria-label="${t("notify.aria.at")}" type="checkbox" id="prayerAlertEnabled" ${state.prayerAlertEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
        <div class="athan-line"><div class="athan-copy"><strong>${t("notify.after")}</strong><span>${t("notify.after.sub")}</span></div>${minuteFieldHTML('id="iqamaMinutesAll"', prayerMinute(null, "", state.iqamaMinutes), t("notify.afterAll"), notificationsOff || !state.iqamaEnabled)}<label class="switch"><input aria-label="${t("notify.aria.after")}" type="checkbox" id="iqamaEnabled" ${state.iqamaEnabled ? "checked" : ""} ${notificationsOff ? "disabled" : ""}/><span></span></label></div>
      </div>
      <div class="settings-card"><div class="settings-card-title">${t("notify.prayers")}</div><div class="sound-grid">${PRAYER_ORDER.map((p) => prayerChipHTML(p, notificationsOff)).join("")}</div>
        <details class="prayer-custom"><summary>${t("notify.customise")}</summary><p class="prayer-custom-hint">${t("notify.customise.sub")}</p><div class="prayer-timing-list">${PRAYER_ORDER.map((p) => prayerTimingHTML(p, notificationsOff)).join("")}</div></details>
      </div>
      <div class="settings-card"><div class="settings-card-title">${t("notify.sound")}</div><div class="sound-grid">${SOUNDS.map(([id]) => `<label class="sound-option ${state.reminderSound === id ? "active" : ""}" data-sound="${id}"><input type="radio" name="reminderSound" value="${id}" ${state.reminderSound === id ? "checked" : ""} class="sr-only">${soundName(id)}</label>`).join("")}</div><div class="sound-actions"><button class="loc-btn" id="testSoundBtn">${t("notify.testSound")}</button></div></div>
    </div>
    <div class="notification-confirmation ${state.notificationsEnabled ? "" : "paused"}"><span class="confirmation-dot"></span><p>${notificationSummary()}</p></div>`;
  }
  if (id === "reading") return `<div class="settings-card"><div class="preview">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><div class="font-grid">${Object.keys(FONT_MAP).map((f) => `<button class="pill ${state.font === f ? "active" : ""}" data-font="${f}" aria-label="${f}"><span class="font-sample">أبجد</span><span>${f}</span></button>`).join("")}</div><div class="row"><label for="arSize">${t("reading.arSize")}</label><input type="range" min="0.7" max="2" step="0.05" value="${state.arSize}" id="arSize"/><span>${state.arSize.toFixed(2)}×</span></div><div class="row"><label>${t("reading.appScale")}</label><div class="zoom-row"><button class="zoom-btn" data-zoom="-0.1">−</button><span class="zoom-val">${Math.round(state.zoom * 100)}%</span><button class="zoom-btn" data-zoom="0.1">+</button></div></div><div class="row azkar-navigation-setting"><label>${t("reading.navMode")}</label><div class="seg" role="group" aria-label="${t("reading.navMode.aria")}"><button class="seg-btn ${azkarNavigationMode() === "buttons-and-swipe" ? "active" : ""}" data-azkar-navigation="buttons-and-swipe">${t("reading.both")}</button><button class="seg-btn ${azkarNavigationMode() === "swipe-only" ? "active" : ""}" data-azkar-navigation="swipe-only">${t("reading.swipe")}</button><button class="seg-btn ${azkarNavigationMode() === "buttons-only" ? "active" : ""}" data-azkar-navigation="buttons-only">${t("reading.buttons")}</button></div></div></div>`;
  if (id === "appearance") {
    return `<div class="settings-card">
      <div class="theme-grid theme-grid-featured">${themeCardsHTML(THEMES, true)}</div>
      ${state.theme === "neobrutal" ? `<div class="neobrutal-tone">${neobrutalToneHTML()}</div>` : ""}
    </div>
    <div class="settings-card">
      <div class="settings-card-title">${t("appearance.accent")}</div>
      ${PALETTE_GROUPS.map(g => `
        <div class="palette-group">
          ${g.title ? `<div class="palette-group-title">${paletteGroupTitle(g.title)}</div>` : ""}
          <div class="palette-grid">
            ${g.keys.map(k => {
              const p = PALETTES[k];
              if (!p) return "";
              return `<button type="button" class="palette-chip ${state.palette === k ? "active" : ""}" data-palette="${k}" title="${paletteName(k)}" aria-label="${paletteName(k)}" style="background:${p.a || "transparent"};${!p.a ? "background:repeating-linear-gradient(45deg,var(--surface-2) 0 4px,var(--line) 4px 8px);" : ""}"></button>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>`;
  }
  return "";
}
function buildSettingsSection(id) {
  return settingsSectionHTML(id, t("settings." + id), t("settings." + id + ".desc"), settingsBodyHTML(id));
}
// Optional Arabic-Indic digits. Text is converted after it is painted, so no
// template has to know about it; inputs and stored values stay Latin.
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function arabicDigitsOn() { return isArabic() && Boolean(state.arabicDigits); }
function localizeDigits(root) {
  if (!arabicDigitsOn() || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (/[0-9]/.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[d]);
  }
}
new MutationObserver((records) => {
  if (!arabicDigitsOn()) return;
  for (const record of records) {
    if (record.type === "characterData") localizeDigits(record.target.parentNode);
    else record.addedNodes.forEach((node) => localizeDigits(node.nodeType === 1 ? node : node.parentNode));
  }
}).observe(document.getElementById("app"), { childList: true, characterData: true, subtree: true });

function renderWelcome() {
  return `<div class="app welcome-view">
    <h1 class="welcome-title">${t("welcome.title")}</h1>
    <p class="welcome-sub">${t("welcome.sub")}</p>
    <div id="locRegion">${locationCardHTML()}</div>
    <button type="button" class="loc-btn primary" id="welcomeContinue" ${state.locationSet ? "" : "disabled"}>${t("welcome.continue")}</button>
    <div class="seg welcome-lang" role="group" aria-label="${t("lang.label")}"><button type="button" class="seg-btn ${state.language === "en" ? "active" : ""}" data-welcome-language="en">${t("lang.en")}</button><button type="button" class="seg-btn ${state.language === "ar" ? "active" : ""}" data-welcome-language="ar">${t("lang.ar")}</button></div>
  </div>`;
}

function wireWelcome() {
  wireLocation();
  $("#welcomeContinue")?.addEventListener("click", () => {
    if (state.locationSet) render();
  });
  document.querySelectorAll("[data-welcome-language]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.language !== b.dataset.welcomeLanguage) update({ language: b.dataset.welcomeLanguage, prayerCache: null });
    })
  );
}

function renderSettings() {
  const active = SETTINGS_SECTIONS.includes(state.settingsSection) ? state.settingsSection : "general";
  return `<div class="app settings-view"><div class="settings-head"><button type="button" class="icon-btn" data-go="home" aria-label="${t("nav.back")}">${icon.back}</button><h1>${t("settings.title")}</h1><span style="width:30px"></span></div><nav class="settings-nav" aria-label="${t("settings.nav.aria")}">${SETTINGS_SECTIONS.map((id) => `<button type="button" class="settings-nav-btn ${active === id ? "active" : ""}" data-settings-section="${id}">${t("settings." + id)}</button>`).join("")}</nav>${buildSettingsSection(active)}${mobileBottomNavHTML("settings")}</div>`;
}
function htmlToNode(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.firstElementChild;
}
function renderSettingsSectionInPlace() {
  const old = document.querySelector(".settings-section");
  if (!old || state.view !== "settings") { render(); return; }
  const active = SETTINGS_SECTIONS.includes(state.settingsSection) ? state.settingsSection : "general";
  const next = htmlToNode(buildSettingsSection(active));
  // Avoid a blank flash: insert the new section next to the old one and
  // remove the old on the next frame so the WebView never paints an empty
  // .app gap (Appearance's theme grid is heavy to parse).
  old.after(next);
  requestAnimationFrame(() => old.remove());
  document.querySelectorAll("[data-settings-section]").forEach((b) => b.classList.toggle("active", b.dataset.settingsSection === active));
  wireSettings();
  syncPressed();
}

// Replaced content gets no animation restart for free (a fresh node with the
// same computed style just appears). Re-trigger the enter animation explicitly
// so swapped panels fade in instead of hard-cutting. Honours reduced motion and
// is a no-op if the platform has no enter animation defined.
function playEnter(el, name = "contentEnter") {
  if (!el || !el.animate) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.classList.remove(name);
  void el.offsetWidth;
  el.classList.add(name);
  const done = () => el.classList.remove(name);
  el.addEventListener("animationend", done, { once: true });
  setTimeout(done, 400);
}

// ---------- render & wire ----------
/** [r, g, b] for any CSS colour, alpha-blended over `under` when translucent. */
function cssRGB(value, under = [255, 255, 255]) {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const parts = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
  probe.remove();
  const [r, g, b, alpha = 1] = parts;
  return [r, g, b].map((c, i) => c * alpha + under[i] * (1 - alpha));
}
function contrastRatio(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const toHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/**
 * The accent as it should render on the current theme: unchanged if it already
 * reads at 4.5:1 as text on the theme's cards, otherwise moved toward the
 * theme's ink just far enough. Used for picked accents, never for theme defaults.
 */
function readableAccent(hex) {
  const cs = getComputedStyle(document.documentElement);
  const bg = cssRGB(cs.getPropertyValue("--bg").trim() || "#ffffff");
  const surface = cssRGB(cs.getPropertyValue("--surface").trim() || "#ffffff", bg);
  const ink = cssRGB(cs.getPropertyValue("--ink").trim() || "#000000");
  const base = cssRGB(hex);
  for (let t = 0; t <= 1; t += 0.04) {
    const mixed = base.map((c, i) => c + (ink[i] - c) * t);
    if (contrastRatio(mixed, surface) >= 4.5) return toHex(mixed);
  }
  return toHex(ink);
}

/** White or near-black text, whichever reads better on `hex`. */
function inkOn(hex) {
  const c = cssRGB(hex);
  return contrastRatio(c, [255, 255, 255]) >= contrastRatio(c, [11, 15, 26]) ? "#ffffff" : "#0b0f1a";
}

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

  const isAr = state.language === "ar";
  document.documentElement.setAttribute("lang", isAr ? "ar" : "en");
  document.documentElement.dir = isAr ? "rtl" : "ltr";
  document.body.classList.toggle("lang-ar", isAr);
  document.documentElement.classList.toggle("large-text", state.zoom >= 1.4);

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

  // popup.css lays the app out with body.pinned rules (originally the
  // extension's pinned window); the app always uses that layout.
  document.body.classList.add("pinned");

  // Picked accents depend on the theme's surfaces, so recompute on theme change.
  const accentKey = `${state.customAccent || palette}|${theme}`;
  if (_appliedStateCache.accentKey !== accentKey) {
    document.body.style.removeProperty("--accent");
    document.body.style.removeProperty("--accent-ink");
    const picked = state.customAccent || PALETTES[palette]?.a;
    if (picked) {
      const accent = readableAccent(picked);
      document.body.style.setProperty("--accent", accent);
      document.body.style.setProperty("--accent-ink", inkOn(accent));
    }
    _appliedStateCache.accentKey = accentKey;
  }
  if (state.customBg) {
    document.body.style.setProperty("--bg", state.customBg);
    document.body.style.setProperty("background", state.customBg);
  } else {
    document.body.style.removeProperty("--bg");
    document.body.style.removeProperty("background");
  }
  if (state.customSurface) {
    document.body.style.setProperty("--surface", state.customSurface);
  } else {
    document.body.style.removeProperty("--surface");
  }
  if (state.customInk) {
    document.body.style.setProperty("--ink", state.customInk);
  } else {
    document.body.style.removeProperty("--ink");
  }

  if (_appliedStateCache.postedTheme !== theme || _appliedStateCache.postedPalette !== palette) {
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
        ZakkirNative.themeColor(bg, isDark);
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
  const html = !state.locationSet ? renderWelcome()
    : state.view === "settings" ? renderSettings()
    : state.view === "schedule" ? renderSchedule()
    : renderHome();
  // Keep the bottom nav DOM node persistent so tab switches don't
  // destroy/recreate it (that was the "whole page re-renders" flash).
  // Preserve the existing sibling nav and replace only the .app view.
  const savedNav = app.querySelector(":scope > .mobile-bottom-nav");
  const existingApp = app.querySelector(":scope > .app");
  if (existingApp && savedNav) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const newApp = tmp.firstElementChild;
    const newNavInNew = newApp?.querySelector?.(".mobile-bottom-nav");
    if (newNavInNew) newNavInNew.remove();
    existingApp.replaceWith(newApp);
    wire();
    // Keep the preserved nav's active states in sync (its DOM was
    // not recreated, so the old .active would otherwise stay on the
    // previous tab and make e.g. Settings look white on Home).
    savedNav.querySelectorAll(".mobile-bottom-nav-btn").forEach(btn => {
      const isActive = btn.dataset.go === state.view;
      btn.classList.toggle("active", isActive);
      if (isActive) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  } else {
    // First render: paint everything, then move the nav out of .app.
    setHTML(app, html);
    wire();
    // Bottom nav is position:fixed. If it stays inside the animated .app,
    // fixed becomes relative to the transformed ancestor and the bar
    // visibly glitches with the page. Make it a sibling of .app instead.
    const root = app.querySelector(":scope > .app");
    const nav = root?.querySelector?.(".mobile-bottom-nav");
    if (nav && nav.parentElement === root) app.appendChild(nav);
  }
  settleMobileNav(state.view);
  // View switches are instant (no enter animation) to avoid the blank flash
  // the 31-row schedule table caused while animating. The native shell
  // tracks the view so the hardware back button returns home.
  ZakkirNative.viewChanged(state.view);
}

ZakkirNative.onBack = () => {
  if (state.view === "home") return false;
  update({ view: "home" });
  return true;
};

function settleMobileNav(nextView) {
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
    const summary = onAzkarSummary();
    el.classList.toggle("is-summary", summary);
    const hintEl = $("#azkarCountHint");
    if (hintEl) hintEl.textContent = summary ? "" : t("azkar.countHint");

    if (bodyWrapper && !summary) {
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
}

function animateAzkarSwap(direction, paint, fromSwipe = false) {
  const el = $("#azkarTap");
  if (!el) {
    paint();
    return;
  }
  if (azkarNavigationBusy) return;
  azkarNavigationBusy = true;
  if (azkarTransitionTimer) clearTimeout(azkarTransitionTimer);

  const startHeight = el.getBoundingClientRect().height;
  el.style.height = `${startHeight}px`;

  // Content travels the way the language reads: in Arabic "next" enters from
  // the left, as when turning pages of an Arabic book.
  const dirSign = isArabic() ? -direction : direction;

  const innerContent = el.querySelector(".azkar-body-wrapper") || el.querySelector(".dhikr") || el;

  if (!fromSwipe) {
    innerContent.style.transition = "transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease";
    innerContent.style.transform = `translateX(${dirSign > 0 ? -50 : 50}px)`;
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
    newInner.style.transform = `translateX(${dirSign > 0 ? 40 : -40}px)`;
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

function goToAzkar(index, direction, fromSwipe = false) {
  const list = currentDhikrList();
  if (!list.length || azkarNavigationBusy) return;
  const target = Math.max(0, Math.min(list.length, index));
  if (target === state.azkarIndex) {
    ZakkirNative.haptic("selection");
    return;
  }
  cancelPendingAzkarCount();
  state.azkarIndex = target;
  state.azkarCount = target < list.length ? itemCount(target) : 0;
  storage.set({ azkarIndex: target, azkarCount: state.azkarCount, azkarCounts: state.azkarCounts });
  animateAzkarSwap(direction, patchAzkarCard, fromSwipe);
}

function navigateAzkar(direction, fromSwipe = false) {
  goToAzkar(state.azkarIndex + direction, direction, fromSwipe);
}

function wireAzkarSwipe(tap) {
  if (!tap || azkarNavigationMode() === "buttons-only") return;
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
      ZakkirNative.haptic("selection");

      // Swipe against the reading direction to go forward: left in English,
      // right in Arabic.
      const direction = (currentDx < 0) !== isArabic() ? 1 : -1;
      inner.style.transition = "transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease";
      inner.style.transform = `translateX(${currentDx < 0 ? -90 : 90}px)`;
      inner.style.opacity = "0.2";

      window.setTimeout(() => {
        navigateAzkar(direction, true);
      }, 90);
    } else {
      inner.style.transition = "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease";
      inner.style.transform = "translateX(0)";
      inner.style.opacity = "1";
    }
  }, { passive: true });
}

function patchPrayerCard(forceRebuild = false) {
  const el = $("#prayerRegion");
  if (!el) return;
  el.classList.toggle("is-collapsed", Boolean(state.prayerCollapsed));
  el.querySelector(".prayer-expanded-content")?.toggleAttribute("inert", Boolean(state.prayerCollapsed));

  const np = nextPrayer();
  const nextName = np ? prayerName(np.name) : (lastErr ? t("prayer.unavailable") : t("prayer.loading"));
  const currentNameEl = el.querySelector(".next-name");

  // If forceRebuild is true, or structure/prayer changed, re-render HTML cleanly
  if (forceRebuild || !currentNameEl || currentNameEl.textContent.trim() !== nextName) {
    setHTML(el, prayerCardHTML());
    wirePrayerTap();
    wirePrayerCollapse();
    return;
  }

  // In-place patch: update countdown text and progress bar fill
  if (np) {
    const countdown = el.querySelector(".next-countdown");
    if (countdown) countdown.innerHTML = countdownHTML(np);

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
// Toggle-style buttons show selection with .active; expose the same state to
// assistive tech. Called after every render and in-place selection change.
const PRESSABLE = "button.seg-btn, button.pill, button.theme-card, button.palette-chip, button.settings-nav-btn, button.sched-mode-btn";
function syncPressed(root = document) {
  root.querySelectorAll(PRESSABLE).forEach((b) => b.setAttribute("aria-pressed", String(b.classList.contains("active"))));
}

function patchSettingsActive(attr, value) {
  document.querySelectorAll(`[${attr}]`).forEach((b) => {
    b.classList.toggle("active", b.getAttribute(attr) === String(value));
  });
  syncPressed();
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
  if (keys.includes("language")) { applyVars(); render(); relocalizeLocationName(); return; }
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
  if (!state.locationSet) { wireWelcome(); return; }
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.view !== b.dataset.go) {
        const order = ["home", "schedule", "settings"];
        const from = order.indexOf(state.view);
        const to = order.indexOf(b.dataset.go);
        mobileNavTransition = from >= 0 && to >= 0 && from !== to ? { from, to } : null;
        ZakkirNative.haptic("selection");
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
    if (onAzkarSummary()) {
      const first = nextUnfinished(-1);
      goToAzkar(first < list.length ? first : 0, -1);
      return;
    }
    const z = list[state.azkarIndex]; if (!z) return;
    const target = parseInt(z.count, 10) || 1;
    const next = state.azkarCount + 1;
    if (!state.azkarHintDismissed) {
      state.azkarHintDismissed = true;
      storage.set({ azkarHintDismissed: true });
    }
    // No tap pulse: it forces a synchronous layout and, via the
    // `mobile-view-enter` :not(.pulse) gate, restarts the enter animation
    // on every tap — the "whole page re-render" the user reported.
    ZakkirNative.haptic(next >= target ? "success" : "light");
    if (next >= target) {
      // Finish in place, then move on to the next unfinished item, or to the
      // session summary once everything is done.
      setItemCount(target);
      patchCount(target, target);
      tap.classList.remove("azkar-complete");
      void tap.offsetWidth;
      tap.classList.add("azkar-complete");
      setTimeout(() => tap.classList.remove("azkar-complete"), 500);
      const after = nextUnfinished();
      setTimeout(() => goToAzkar(after, after > state.azkarIndex ? 1 : -1), 420);
    } else {
      // in-place patch: no full re-render, no flicker
      setItemCount(next);
      patchCount(next, target);
    }
  });
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.currentTarget?.blur?.();
      const dir = parseInt(b.dataset.nav, 10);
      navigateAzkar(dir);
    })
  );
  const undo = $("#resetBtn");
  if (undo) {
    // Tap: take back one count (a mis-tap shouldn't cost the whole item).
    // Hold: reset this item to zero.
    let holdTimer = null;
    let held = false;
    const currentTarget = () => itemTarget(currentDhikrList()[state.azkarIndex]);
    undo.addEventListener("pointerdown", () => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (onAzkarSummary()) return;
        held = true;
        setItemCount(0);
        ZakkirNative.haptic("success");
        patchCount(0, currentTarget());
      }, 600);
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      undo.addEventListener(type, () => clearTimeout(holdTimer));
    }
    undo.addEventListener("click", (e) => {
      e.currentTarget?.blur?.();
      if (held) { held = false; return; }
      if (onAzkarSummary() || state.azkarCount <= 0) {
        ZakkirNative.haptic("selection");
        return;
      }
      setItemCount(state.azkarCount - 1);
      ZakkirNative.haptic("selection");
      patchCount(state.azkarCount, currentTarget());
    });
  }
  if (state.view === "settings") wireSettings();
  syncPressed();
}

function neobrutalToneHTML() {
  return `<span>${t("neobrutal.label")}</span><div class="seg"><button class="seg-btn ${state.neobrutalContrast === "quiet" ? "active" : ""}" data-neobrutal-contrast="quiet">${t("neobrutal.quiet")}</button><button class="seg-btn ${state.neobrutalContrast === "high" ? "active" : ""}" data-neobrutal-contrast="high">${t("neobrutal.high")}</button></div>`;
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
  document.querySelectorAll("[data-language]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.language === b.dataset.language) return;
      update({ language: b.dataset.language, prayerCache: null });
    })
  );
  document.querySelectorAll("[data-digits]").forEach((b) =>
    b.addEventListener("click", () => {
      const arabic = b.dataset.digits === "arabic";
      if (Boolean(state.arabicDigits) === arabic) return;
      state.arabicDigits = arabic;
      storage.set({ arabicDigits: arabic });
      render();
    })
  );
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

  const accentIn = $("#customAccentInput");
  const bgIn = $("#customBgInput");
  const surfaceIn = $("#customSurfaceInput");
  const inkIn = $("#customInkInput");
  const resetColorsBtn = $("#resetCustomColors");

  accentIn?.addEventListener("input", (e) => update({ customAccent: e.target.value }));
  bgIn?.addEventListener("input", (e) => update({ customBg: e.target.value }));
  surfaceIn?.addEventListener("input", (e) => update({ customSurface: e.target.value }));
  inkIn?.addEventListener("input", (e) => update({ customInk: e.target.value }));

  resetColorsBtn?.addEventListener("click", () => {
    update({ customAccent: "", customBg: "", customSurface: "", customInk: "" });
  });
  // paint theme swatches with each theme's accent/bg preview
  const THEME_SW = {
    light:      { bg: "#fafafa", a: "#1d4ed8", style: "plain" },
    dark:       { bg: "#0b0d12", a: "#4b8df8", style: "plain" },
    liquidglass: { bg: "linear-gradient(135deg,#e7ebe6,#cbd2ce 48%,#dfdfd7)", a: "#4f625d", style: "liquidglass" },
    frutiger:    { bg: "linear-gradient(180deg,#d3e1dc 0 48%,#aabd9b 49%)", a: "#4b6d61", style: "frutiger" },
    layl:        { bg: "linear-gradient(180deg,#0d1326,#101a36)", a: "#b9c7e9", style: "layl" },
    zellige:     { bg: "linear-gradient(170deg,#103138,#0c2229)", a: "#d08a52", style: "zellige" },
    sakura:      { bg: "linear-gradient(180deg,#fbf5f5,#f4e4e8)", a: "#a43d5d", style: "sakura" },
    mushaf:      { bg: "linear-gradient(170deg,#122a25,#0d1f1c)", a: "#d8b46a", style: "mushaf" },
    "frutiger-dark":    { bg: "linear-gradient(180deg,#243b42 0 48%,#1d3028 49%)", a: "#91b69b", style: "frutiger" },
    onyx:       { bg: "#0b0b0d", a: "#e8e2d4", style: "onyx" },
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
  // One value for every prayer; editing it clears any per-prayer overrides so
  // what you see in "Customise per prayer" always matches what is scheduled.
  [["reminderMinutesAll", "reminderMinutes", "reminderMinutesByPrayer", "before"], ["iqamaMinutesAll", "iqamaMinutes", "iqamaMinutesByPrayer", "after"]].forEach(([id, valueKey, mapKey, kind]) => {
    const input = $("#" + id);
    if (!input) return;
    input.addEventListener("change", () => {
      const minutes = Math.min(60, Math.max(1, parseInt(input.value, 10) || 1));
      input.value = String(minutes);
      state[valueKey] = minutes;
      state[mapKey] = {};
      document.querySelectorAll(`[data-prayer-minutes="${kind}"]`).forEach((field) => { field.value = String(minutes); });
      storage.set({ [valueKey]: minutes, [mapKey]: {} });
      syncReminders();
    });
  });
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

  // Sound picker
  document.querySelectorAll("[data-sound]").forEach((lbl) => {
    lbl.addEventListener("click", () => {
      state.reminderSound = lbl.dataset.sound;
      storage.set({ reminderSound: state.reminderSound });
      document.querySelectorAll("[data-sound]").forEach((l) => {
        l.classList.toggle("active", l.dataset.sound === state.reminderSound);
        const radio = l.querySelector("input");
        if (radio) radio.checked = l.dataset.sound === state.reminderSound;
      });
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
        testSoundBtn.textContent = t("notify.testSound");
      } else {
        testSoundBtn.textContent = t("notify.stopPreview");
        playSound(state.reminderSound, () => {
          testSoundBtn.textContent = t("notify.testSound");
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
  const src = globalThis.__ZAKKIR_SOUNDS__?.[soundId];
  if (!src) {
    if (onEndCb) onEndCb();
    return;
  }
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

// ---------- init ----------
(async function init() {
  const data = await storage.get();
  const migratedData = migrateNotificationSettings(data);
  state = { ...DEFAULTS, ...migratedData };
  // The default or a saved choice may name a sound this build doesn't ship.
  if (!SOUNDS.some(([id]) => id === state.reminderSound)) state.reminderSound = SOUNDS[0][0];
  // Auto-detect language on first boot: the device locale from the native
  // shell, else the WebView's language.
  if (!state.language) {
    const detected = String(ZakkirNative.locale || globalThis.navigator?.language || document.documentElement.lang || "en")
      .toLowerCase()
      .startsWith("ar") ? "ar" : "en";
    state.language = detected;
    storage.set({ language: detected });
  }
  if (data.reminderEnabled !== undefined || data.athanEnabled !== undefined) {
    storage.set({
      remindersEnabled: state.remindersEnabled,
      prayerAlertEnabled: state.prayerAlertEnabled,
      reminderEnabled: null,
      athanEnabled: null,
    });
  }

  // Anyone who already picked a location (before this flag existed) is done.
  if (!state.locationSet && storedKeys.has("lat") && storedKeys.has("lng")) state.locationSet = true;
  if (!state.locationSet) state.locationTab = "gps";

  // Always start in time-based mode. A manual category choice can still
  // override the category for the current session, but should not
  // permanently prevent the next launch from opening Morning or Evening.
  state.autoTime = true;
  storage.set({ autoTime: true });

  if (!PALETTES[state.palette]) {
    state.palette = DEFAULTS.palette;
    storage.set({ palette: state.palette });
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

  // popup.css makes body.electron the scroll container (originally the
  // desktop window styling); the app relies on that layout.
  document.body.classList.add("electron");
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      update({ popupW: window.innerWidth, popupH: window.innerHeight });
    }, 500);
  });

  try { await loadAzkar(); } catch (e) { lastErr = t("err.azkar"); }
  maybeResetDaily();
  applyAutoCategory();
  render();
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
  if (countSaveTimer) storage.set({ azkarCount: state.azkarCount, azkarCounts: state.azkarCounts });
});
