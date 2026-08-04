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
  notificationsEnabled: true,
  reminderEnabled: false,
  reminderMinutes: 10,
  reminderMinutesByPrayer: {},
  athanEnabled: true,
  reminderPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  iqamaEnabled: false,
  iqamaMinutes: 10,
  iqamaMinutesByPrayer: {},
  badgeEnabled: false,
  _sentReminders: {},
  _lastTick: null,
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
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const enabled = state.reminderPrayers || {};
  const preMins = Math.max(0, state.reminderMinutes ?? 10);
  const iqMins = Math.max(0, state.iqamaMinutes ?? 10);
  const upcoming = [];
  for (const name of PRAYER_ORDER) {
    const p = toMin(prayers[name]);
    if (Number.isNaN(p)) continue;
    if (isPrayerEnabled(enabled, name)) {
      if (preMins > 0) {
        const pre = Math.max(1, state.reminderMinutesByPrayer?.[name] ?? preMins);
        upcoming.push({ label: `${name} before`, at: p - pre });
      }
      if (state.athanEnabled) upcoming.push({ label: `${name} at`, at: p });
      if (iqMins > 0) {
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
  if (state.notificationsEnabled && (anyEnabled || state.athanEnabled)) {
    const preMins = Math.max(0, state.reminderMinutes ?? 10);
    const iqMins = Math.max(0, state.iqamaMinutes ?? 10);
    const sound = state.reminderSound || "adhan-1";
    const today = todayKey();
    const sent = { ...(state._sentReminders || {}) };

    for (const p of list) {
      if (!isPrayerEnabled(enabled, p.name)) continue;

      // Pre-athan reminder
      if (preMins > 0) {
        const prayerPreMins = Math.max(1, state.reminderMinutesByPrayer?.[p.name] ?? preMins);
        const trigger = p.m - prayerPreMins;
        const key = `${today}|${p.name}|pre|${prayerPreMins}`;
        if (nowM >= trigger && nowM < p.m && !sent[key]) {
          const result = await notify(key, `${p.name} in ${prayerPreMins} min`, `Prayer time at ${prayers[p.name]}.`, sound);
          if (result.ok) sent[key] = true;
        }
      }
      // At-time notification (athan)
      if (state.athanEnabled) {
        const keyAt = `${today}|${p.name}|at`;
        if (nowM >= p.m && nowM < p.m + 15 && !sent[keyAt]) {
          const result = await notify(keyAt, `${p.name} now`, `It's time for ${p.name} (${prayers[p.name]}).`, sound);
          if (result.ok) sent[keyAt] = true;
        }
      }
      // Iqama reminder (after athan)
      if (iqMins > 0) {
        const prayerIqMins = Math.max(1, state.iqamaMinutesByPrayer?.[p.name] ?? iqMins);
        const iq = p.m + prayerIqMins;
        const keyIq = `${today}|${p.name}|iq|${prayerIqMins}`;
        if (nowM >= iq && nowM < iq + 30 && !sent[keyIq]) {
          const result = await notify(keyIq, `${p.name} Iqama`, `Iqama time — ${prayerIqMins} min after athan.`, sound);
          if (result.ok) sent[keyIq] = true;
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
        athanEnabled: state.athanEnabled,
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
