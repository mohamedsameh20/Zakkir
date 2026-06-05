// Zakkir background — schedules pre-athan reminders and updates the toolbar
// badge with time-to-next-prayer. Works in Chrome (service_worker) and Firefox
// (event page via "scripts").

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const DEFAULTS = {
  city: "Cairo",
  country: "Egypt",
  method: 5,
  useCoords: false,
  lat: null,
  lng: null,
  prayerCache: null,
  reminderEnabled: false,
  reminderMinutes: 10,
  athanEnabled: true,
  reminderPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  iqamaEnabled: false,
  iqamaMinutes: 10,
  badgeEnabled: false,
  _sentReminders: {},
};

function todayKey() { return new Date().toISOString().slice(0, 10); }
function ddmmyyyy() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function toMin(s) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }

function getState() {
  return new Promise((res) => chrome.storage.local.get(DEFAULTS, res));
}

async function ensurePrayers(state) {
  const today = todayKey();
  const c = state.prayerCache;
  const sameLoc = c && (state.useCoords && state.lat != null && state.lng != null
    ? (c.lat === state.lat && c.lng === state.lng)
    : (c.city === state.city && c.country === state.country));
  if (c && c.date === today && sameLoc && c.method === state.method) return c.timings;

  let url;
  if (state.useCoords && state.lat != null && state.lng != null) {
    url = `https://api.aladhan.com/v1/timings/${ddmmyyyy()}?latitude=${state.lat}&longitude=${state.lng}&method=${state.method || 5}`;
  } else {
    url = `https://api.aladhan.com/v1/timingsByCity/${ddmmyyyy()}?city=${encodeURIComponent(state.city || "Cairo")}&country=${encodeURIComponent(state.country || "Egypt")}&method=${state.method || 5}`;
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
      date: today, city: state.city, country: state.country,
      lat: state.lat, lng: state.lng, method: state.method,
      timings: prayers, hijri,
    };
    await chrome.storage.local.set({ prayerCache: cache });
    return prayers;
  } catch (e) {
    return c?.timings || null;
  }
}

function notify(id, title, message) {
  try {
    chrome.notifications.create(id, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon_48.png"),
      title,
      message,
      priority: 2,
    });
  } catch (e) { /* notifications may be unavailable */ }
}

async function tick() {
  const state = await getState();
  const prayers = await ensurePrayers(state);

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
  const anyReminder = state.reminderEnabled || state.iqamaEnabled || state.athanEnabled;
  if (anyReminder) {
    const preMins = Math.max(0, state.reminderMinutes ?? 10);
    const iqMins = Math.max(0, state.iqamaMinutes ?? 10);
    const enabled = state.reminderPrayers || {};
    const today = todayKey();
    const sent = { ...(state._sentReminders || {}) };

    for (const p of list) {
      if (!enabled[p.name]) continue;

      // Pre-athan reminder
      if (state.reminderEnabled && preMins > 0) {
        const trigger = p.m - preMins;
        const key = `${today}|${p.name}|pre`;
        if (nowM >= trigger && nowM < trigger + 2 && !sent[key]) {
          notify(key, `${p.name} in ${preMins} min`, `Prayer time at ${prayers[p.name]}.`);
          sent[key] = true;
        }
      }
      // At-time notification (athan)
      if (state.athanEnabled) {
        const keyAt = `${today}|${p.name}|at`;
        if (nowM >= p.m && nowM < p.m + 2 && !sent[keyAt]) {
          notify(keyAt, `${p.name} now`, `It's time for ${p.name} (${prayers[p.name]}).`);
          sent[keyAt] = true;
        }
      }
      // Iqama reminder (after athan)
      if (state.iqamaEnabled && iqMins > 0) {
        const iq = p.m + iqMins;
        const keyIq = `${today}|${p.name}|iq`;
        if (nowM >= iq && nowM < iq + 2 && !sent[keyIq]) {
          notify(keyIq, `${p.name} Iqama`, `Iqama time — ${iqMins} min after athan.`);
          sent[keyIq] = true;
        }
      }
    }
    // Keep only today's entries
    const cleaned = {};
    for (const k of Object.keys(sent)) if (k.startsWith(today + "|")) cleaned[k] = sent[k];
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
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "refresh") { ensureAlarm(); tick(); }
});
// Run once on script load (covers SW wake-ups)
ensureAlarm();
tick();
