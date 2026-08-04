// Zakkir background — schedules pre-athan reminders and updates the toolbar
// badge with time-to-next-prayer. Works in Chrome (service_worker) and Firefox
// (event page via "scripts").

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const notificationScheduler = globalThis.ZakkirNotifications;

const DEFAULTS = {
  city: "Cairo",
  country: "Egypt",
  method: 5,
  useCoords: false,
  lat: null,
  lng: null,
  prayerCache: null,
  previousPrayerCache: null,
  notificationsEnabled: true,
  remindersEnabled: false,
  reminderMinutes: 10,
  reminderMinutesByPrayer: {},
  prayerAlertEnabled: true,
  reminderPrayers: ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
  iqamaEnabled: false,
  iqamaMinutes: 10,
  iqamaMinutesByPrayer: {},
  badgeEnabled: false,
  _sentReminders: {},
  _lastTick: null,
};

function todayKey(date = new Date()) { return notificationScheduler.localDateKey(date); }
function ddmmyyyy(date = new Date()) {
  const d = date, p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function toMin(s) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }

function getState() {
  return new Promise((res) => chrome.storage.local.get(null, (raw) => {
    const state = { ...DEFAULTS, ...notificationScheduler.migrateSettings(raw) };
    chrome.storage.local.set(notificationScheduler.normalizeSettings(state));
    chrome.storage.local.remove(["reminderEnabled", "athanEnabled"]);
    res(state);
  }));
}

async function ensurePrayers(state, date = new Date()) {
  const dateKey = todayKey(date);
  const currentDate = todayKey();
  const c = state.prayerCache?.date === dateKey ? state.prayerCache : state.previousPrayerCache?.date === dateKey ? state.previousPrayerCache : null;
  const sameLoc = c && (state.useCoords && state.lat != null && state.lng != null
    ? (c.lat === state.lat && c.lng === state.lng)
    : (c.city === state.city && c.country === state.country));
  if (c && sameLoc && c.method === state.method) return c.timings;

  let url;
  if (state.useCoords && state.lat != null && state.lng != null) {
    url = `https://api.aladhan.com/v1/timings/${ddmmyyyy(date)}?latitude=${state.lat}&longitude=${state.lng}&method=${state.method || 5}`;
  } else {
    url = `https://api.aladhan.com/v1/timingsByCity/${ddmmyyyy(date)}?city=${encodeURIComponent(state.city || "Cairo")}&country=${encodeURIComponent(state.country || "Egypt")}&method=${state.method || 5}`;
  }
  try {
    const r = await fetch(url);
    const j = await r.json();
    if (!j?.data?.timings) throw new Error("bad");
    const t = j.data.timings;
    const prayers = { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    const h = j.data.date.hijri;
    const hijri = `${h.day} ${h.month.en} ${h.year} AH`;
    const cache = {
      date: dateKey, city: state.city, country: state.country,
      lat: state.lat, lng: state.lng, method: state.method,
      timings: prayers, hijri,
    };
    const cacheKey = dateKey === currentDate ? "prayerCache" : "previousPrayerCache";
    const patch = { [cacheKey]: cache };
    if (cacheKey === "prayerCache" && state.prayerCache?.date && state.prayerCache.date !== dateKey) {
      patch.previousPrayerCache = state.prayerCache;
    }
    await chrome.storage.local.set(patch);
    return prayers;
  } catch (e) {
    return c?.timings || null;
  }
}

function isPrayerEnabled(reminderPrayers, prayerName) {
  if (Array.isArray(reminderPrayers)) return reminderPrayers.includes(prayerName);
  if (reminderPrayers && typeof reminderPrayers === "object") return Boolean(reminderPrayers[prayerName]);
  return true;
}

function playNotificationSound(soundName) {
  if (!soundName || soundName === "silent") return;
  try {
    const file = soundName.startsWith("adhan") ? `${soundName}.mp3` : `${soundName}.mp3`;
    const audio = new Audio(chrome.runtime.getURL(`sounds/${file}`));
    audio.play().catch(() => {});
  } catch (_) {}
}

function notify(id, title, message, soundName) {
  return new Promise((resolve) => {
    try {
      if (soundName) playNotificationSound(soundName);
      chrome.notifications.create(id, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon_48.png"),
        title,
        message,
        priority: 2,
      }, (createdId) => {
        const error = chrome.runtime.lastError;
        if (error) resolve({ ok: false, error: error.message || String(error) });
        else resolve({ ok: true, id: createdId || id });
      });
    } catch (e) {
      resolve({ ok: false, error: e?.message || String(e) });
    }
  });
}

function getNextReminder(state, prayers) {
  if (!prayers) return null;
  const config = notificationScheduler.normalizeSettings(state);
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const enabled = state.reminderPrayers || {};
  const preMins = Math.max(0, state.reminderMinutes ?? 10);
  const iqMins = Math.max(0, state.iqamaMinutes ?? 10);
  const upcoming = [];
  for (const name of PRAYER_ORDER) {
    const p = toMin(prayers[name]);
    if (Number.isNaN(p)) continue;
    if (config.reminderPrayers.includes(name)) {
      if (config.remindersEnabled) {
        const pre = Math.max(1, state.reminderMinutesByPrayer?.[name] ?? preMins);
        upcoming.push({ label: `${name} before`, at: p - pre });
      }
      if (config.prayerAlertEnabled) upcoming.push({ label: `${name} at`, at: p });
      if (config.iqamaEnabled) {
        const iq = Math.max(1, state.iqamaMinutesByPrayer?.[name] ?? iqMins);
        upcoming.push({ label: `${name} iqama`, at: p + iq });
      }
    }
  }
  const next = upcoming
    .map((e) => ({ ...e, at: ((e.at % 1440) + 1440) % 1440, days: 0 }))
    .filter((e) => e.at >= nowM)
    .sort((a, b) => a.at - b.at)[0];
  if (!next) return null;
  const h = Math.floor(next.at / 60);
  const m = next.at % 60;
  return { label: next.label, time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}

async function tick() {
  const state = await getState();
  const prayers = await ensurePrayers(state);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const previousPrayers = await ensurePrayers(state, yesterday);
  try { await chrome.storage.local.set({ _lastTick: new Date().toISOString() }); } catch {}

  if (!prayers) {
    try { chrome.action.setBadgeText({ text: "" }); } catch {}
    return;
  }

  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const list = PRAYER_ORDER.map((n) => ({ name: n, m: toMin(prayers[n]) }));
  let next = list.find((p) => p.m > nowM);
  if (!next) next = { ...list[0], m: list[0].m + 1440 };
  const left = next.m - nowM;

  // Badge
  try {
    if (state.badgeEnabled) {
      const h = Math.floor(left / 60);
      const m = left % 60;
      const txt = h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}m`;
      chrome.action.setBadgeText({ text: txt });
      chrome.action.setBadgeBackgroundColor({ color: "#0ea5e9" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch {}

  // Reminders
  const enabled = state.reminderPrayers || {};
  const anyEnabled = PRAYER_ORDER.some((n) => isPrayerEnabled(enabled, n));
  if (state.notificationsEnabled && anyEnabled) {
    const preMins = Math.max(0, state.reminderMinutes ?? 10);
    const iqMins = Math.max(0, state.iqamaMinutes ?? 10);
    const sound = state.reminderSound || "adhan-1";
    const today = todayKey();
    const sent = { ...(state._sentReminders || {}) };

const PRAYER_MESSAGES = {
  Fajr: [
    { title: "صلاة الفجر 🌅", body: "«أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَى غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا»" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "«رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "«بَشِّرِ الْمَشَّائِينَ فِي الظُّلَمِ إِلَى الْمَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ الْقِيَامَةِ» — سنن أبي داود والترمذي" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ» — متفق عليه" },
    { title: "صلاة الفجر 🌅", body: "«أَثْقَلُ الصَّلَاةِ عَلَى الْمُنَافِقِينَ صَلَاةُ الْعِشَاءِ وَصَلَاةُ الْفَجْرِ» — متفق عليه" },
    { title: "صلاة الفجر 🌅", body: "«لَنْ يَلِجَ النَّارَ أَحَدٌ صَلَّى قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا» — صحيح مسلم" },
    { title: "صلاة الفجر 🌅", body: "قال عمر رضي الله عنه: «لَأَنْ أَشْهَدَ صَلَاةَ الصُّبْحِ فِي الْجَمَاعَةِ أَحَبُّ إِلَيَّ مِنْ قِيَامِ لَيْلَةٍ»" },
    { title: "صلاة الفجر 🌅", body: "«مَنْ بَاتَ طَاهِرًا بَاتَ فِي شِعَارِهِ مَلَكٌ... فَيَقُولُ الْمَلَكُ: اللَّهُمَّ اغْفِرْ لِعَبْدِكَ فُلَانٍ» — صحيح ابن حبان" }
  ],
  Dhuhr: [
    { title: "صلاة الظهر ☀️", body: "«وَمِنْ آنَاءِ اللَّيْلِ فَسَبِّحْ وَأَطْرَافَ النَّهَارِ لَعَلَّكَ تَرْضَى»" },
    { title: "صلاة الظهر ☀️", body: "«إِنَّ أَوَّلَ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ مِنْ عَمَلِهِ صَلَاتُهُ» — سنن الترمذي" },
    { title: "صلاة الظهر ☀️", body: "«إِذَا زَالَتِ الشَّمْسُ فُتِحَتْ أَبْوَابُ السَّمَاءِ... فَأُحِبُّ أَنْ يَصْعَدَ لِي فِيهِنَّ عَمَلٌ صَالِحٌ» — سنن الترمذي" },
    { title: "صلاة الظهر ☀️", body: "«أَرْبَعٌ قَبْلَ الظُّهْرِ لَيْسَ فِيهِنَّ تَسْلِيمٌ تُفْتَحُ لَهُنَّ أَبْوَابُ السَّمَاءِ» — سنن أبي داود" },
    { title: "صلاة الظهر ☀️", body: "«مَنْ حَافَظَ عَلَى أَرْبَعِ رَكَعَاتٍ قَبْلَ الظُّهْرِ وَأَرْبَعٍ بَعْدَهَا حَرَّمَهُ اللَّهُ عَلَى النَّارِ» — سنن الترمذي" }
  ],
  Asr: [
    { title: "صلاة العصر (الصلاة الوسطى) 🌤️", body: "«حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى وَقُومُوا لِلَّهِ قَانِتِينَ»" },
    { title: "صلاة العصر 🌤️", body: "«مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ» — صحيح البخاري" },
    { title: "صلاة العصر 🌤️", body: "«الَّذِي تَفُوتُهُ صَلَاةُ الْعَصْرِ كَأَنَّمَا وُتِرَ أَهْلَهُ وَمَالَهُ» — متفق عليه" },
    { title: "صلاة العصر 🌤️", body: "«مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ» — متفق عليه" },
    { title: "صلاة العصر 🌤️", body: "قال بريدة رضي الله عنه: «بَكِّرُوا بِصَلَاةِ الْعَصْرِ، فَإِنَّ النَّبِيَّ ﷺ قَالَ: مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ»" }
  ],
  Maghrib: [
    { title: "صلاة المغرب 🌅", body: "«وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ الْغُرُوبِ»" },
    { title: "صلاة المغرب 🌅", body: "«فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ»" },
    { title: "صلاة المغرب 🌅", body: "«لَا تَزَالُ أُمَّتِي بِخَيْرٍ - أَوْ عَلَى الْفِطْرَةِ - مَا لَمْ يُؤَخِّرُوا الْمَغْرِبَ حَتَّى تَشْتَبِكَ النُّجُومُ» — سنن أبي داود" },
    { title: "صلاة المغرب 🌅", body: "«إِذَا أَقْبَلَ اللَّيْلُ مِنْ هَا هُنَا، وَأَدْبَرَ النَّهَارُ مِنْ هَا هُنَا، وَغَرَبَتِ الشَّمْسُ، فَقَدْ أَفْطَرَ الصَّائِمُ» — متفق عليه" }
  ],
  Isha: [
    { title: "صلاة العشاء 🌙", body: "«وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَكَ عَسَى أَنْ يَبْعَثَكَ رَبُّكَ مَقَامًا مَحْمُودًا»" },
    { title: "صلاة العشاء 🌙", body: "«مَنْ شَهِدَ الْعِشَاءَ فِي جَمَاعَةٍ كَانَ لَهُ قِيَامُ نِصْفِ لَيْلَةٍ» — صحيح مسلم" },
    { title: "صلاة العشاء 🌙", body: "«لَوْ يَعْلَمُونَ مَا فِي الْعَتَمَةِ وَالصُّبْحِ لَأَتَوْهُمَا وَلَوْ حَبْوًا» — متفق عليه" },
    { title: "صلاة العشاء 🌙", body: "«كَانُوا قَلِيلًا مِنَ اللَّيْلِ مَا يَهْجَعُونَ * وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ»" }
  ]
};

const PRE_PRAYER_MESSAGES = [
  { title: "اقتراب موعد الصلاة ⏳", body: "«مَنْ تَطَهَّرَ فِي بَيْتِهِ، ثُمَّ مَشَى إِلَى بَيْتٍ مِنْ بُيُوتِ اللَّهِ... كَانَتْ خَطْوَتَاهُ إِحْدَاهُمَا تَحُطُّ خَطِيئَةً، وَالْأُخْرَى تَرْفَعُ دَرَجَةً» — صحيح مسلم" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«إِسْبَاغُ الْوُضُوءِ عَلَى الْمَكَارِهِ، وَكَثْرَةُ الْخُطَا إِلَى الْمَسَاجِدِ، وَانْتِظَارُ الصَّلَاةِ بَعْدَ الصَّلَاةِ... يَمْحُو اللَّهُ بِهِ الْخَطَايَا» — صحيح مسلم" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال معاذ رضي الله عنه: «إِذَا صَلَّيْتَ صَلَاةً، فَصَلِّ صَلَاةَ مُوَدِّعٍ، لَا تَظُنَّ أَنَّكَ تَعُودُ إِلَيْهَا أَبَدًا»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "قال وكيع بن الجراح رحمه الله: «مَنْ لَمْ يَأْخُذْ أُهْبَةَ الصَّلَاةِ قَبْلَ وَقْتِهَا لَمْ يَكُنْ وَقَّرَهَا»" },
  { title: "اقتراب موعد الصلاة ⏳", body: "«الدُّعَاءُ لَا يُرَدُّ بَيْنَ الْأَذَانِ وَالْإِقَامَةِ» — سنن الترمذي" },
  { title: "اقتراب موعد الصلاة ⏳", body: "كتب عمر رضي الله عنه لعماله: «إِنَّ أَهَمَّ أُمُورِكُمْ عِنْدِي الصَّلَاةُ، فَمَنْ حَفِظَهَا وَحَافَظَ عَلَيْهَا حَفِظَ دِينَهُ»" }
];

function getRandomNotificationMessage(prayerName, isPre = false) {
  if (isPre) {
    const idx = Math.floor(Math.random() * PRE_PRAYER_MESSAGES.length);
    return PRE_PRAYER_MESSAGES[idx];
  }
  const list = PRAYER_MESSAGES[prayerName] || [];
  if (!list.length) {
    return { title: `صلاة ${prayerName}`, body: `حان الآن موعد صلاة ${prayerName}` };
  }
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

    const config = notificationScheduler.normalizeSettings(state);
    const cleaned = { ...(state._sentReminders || {}) };
    for (const event of notificationScheduler.dueEvents(prayers, config, new Date(), previousPrayers || prayers)) {
      if (cleaned[event.key]) continue;
      const msg = event.type === "pre" ? getRandomNotificationMessage(event.prayer, true) : getRandomNotificationMessage(event.prayer, false);
      const title = event.type === "pre" ? `${msg.title} (بعد ${event.minutes} دقيقة)` : event.type === "iqama" ? `إقامة صلاة ${event.prayer}` : msg.title;
      const body = event.type === "iqama" ? `حان وقت الإقامة — بعد ${event.minutes} دقيقة من الأذان.` : msg.body;
      const result = await notify(event.key, title, body, config.reminderSound);
      if (result.ok) cleaned[event.key] = true;
    }
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const key of Object.keys(cleaned)) {
      const date = new Date(`${key.split("|")[0]}T00:00:00`);
      if (!Number.isNaN(date.getTime()) && date.getTime() < cutoff) delete cleaned[key];
    }
    await chrome.storage.local.set({ _sentReminders: cleaned });
  }
}

function ensureAlarm() {
  try {
    chrome.alarms.get("tick", (a) => {
      if (!a) chrome.alarms.create("tick", { periodInMinutes: 1 });
    });
  } catch {
    try { chrome.alarms.create("tick", { periodInMinutes: 1 }); } catch {}
  }
}

chrome.runtime.onInstalled.addListener(() => { ensureAlarm(); tick(); });
chrome.runtime.onStartup?.addListener(() => { ensureAlarm(); tick(); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "tick") tick(); });
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "refresh") { ensureAlarm(); tick(); }
  if (msg && msg.type === "test-notification") {
    (async () => {
      const state = await getState();
      const result = await notify(`zakkir-test-${Date.now()}`, "Zakkir notification test", "Notifications are working. You will be reminded before and after each prayer you selected.", state.reminderSound || "adhan-1");
      sendResponse(result);
    })();
    return true;
  }
  if (msg && msg.type === "status") {
    (async () => {
      const state = await getState();
      const prayers = await ensurePrayers(state);
      const next = await getNextReminder(state, prayers);
      sendResponse({
        lastTick: state._lastTick || null,
        notificationsEnabled: state.notificationsEnabled,
        prayerAlertEnabled: state.prayerAlertEnabled,
        remindersEnabled: state.remindersEnabled,
        iqamaEnabled: state.iqamaEnabled,
        reminderPrayers: state.reminderPrayers,
        reminderMinutes: state.reminderMinutes,
        reminderMinutesByPrayer: state.reminderMinutesByPrayer,
        iqamaMinutes: state.iqamaMinutes,
        iqamaMinutesByPrayer: state.iqamaMinutesByPrayer,
        cacheDate: state.prayerCache?.date || null,
        hasPrayers: !!prayers,
        next: next,
      });
    })();
    return true;
  }
});
// Run once on script load (covers SW wake-ups)
ensureAlarm();
tick();
