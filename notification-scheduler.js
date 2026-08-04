(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZakkirNotifications = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const DEFAULT_SETTINGS = {
    notificationsEnabled: true,
    remindersEnabled: false,
    prayerAlertEnabled: true,
    iqamaEnabled: false,
    reminderPrayers: PRAYER_ORDER,
    reminderMinutes: 10,
    reminderMinutesByPrayer: {},
    iqamaMinutes: 10,
    iqamaMinutesByPrayer: {},
    reminderSound: "adhan-1",
  };

  function clampMinutes(value, fallback) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(60, Math.max(1, n));
  }

  function normalizePrayers(value) {
    if (Array.isArray(value)) return PRAYER_ORDER.filter((name) => value.includes(name));
    if (value && typeof value === "object") return PRAYER_ORDER.filter((name) => Boolean(value[name]));
    return [...PRAYER_ORDER];
  }

  function normalizeSettings(input = {}) {
    const source = input || {};
    const reminderSound = source.reminderSound === "adhan-3" ? "adhan-2" : source.reminderSound || DEFAULT_SETTINGS.reminderSound;
    return {
      notificationsEnabled: source.notificationsEnabled !== false,
      remindersEnabled: source.remindersEnabled ?? source.reminderEnabled ?? false,
      prayerAlertEnabled: source.prayerAlertEnabled ?? source.athanEnabled ?? true,
      iqamaEnabled: source.iqamaEnabled === true,
      reminderMinutes: clampMinutes(source.reminderMinutes, 10),
      reminderMinutesByPrayer: source.reminderMinutesByPrayer || {},
      iqamaMinutes: clampMinutes(source.iqamaMinutes, 10),
      iqamaMinutesByPrayer: source.iqamaMinutesByPrayer || {},
      reminderPrayers: normalizePrayers(source.reminderPrayers),
      reminderSound,
    };
  }

  function migrateSettings(input = {}) {
    const source = input || {};
    const normalized = normalizeSettings(source);
    const migrated = { ...source, ...normalized };
    delete migrated.reminderEnabled;
    delete migrated.athanEnabled;
    return migrated;
  }

  function parseHHMM(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }

  function localDateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function targetDate(date, minutes) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setMinutes(minutes);
    return result;
  }

  function buildEvents(times, settingsInput, date = new Date()) {
    const settings = normalizeSettings(settingsInput);
    if (!settings.notificationsEnabled) return [];
    const events = [];
    for (const prayer of settings.reminderPrayers) {
      const athanMinutes = parseHHMM(times?.[prayer]);
      if (athanMinutes == null) continue;
      const before = clampMinutes(settings.reminderMinutesByPrayer?.[prayer], settings.reminderMinutes);
      const after = clampMinutes(settings.iqamaMinutesByPrayer?.[prayer], settings.iqamaMinutes);
      if (settings.remindersEnabled) {
        events.push({
          type: "pre",
          prayer,
          minutes: before,
          at: targetDate(date, athanMinutes - before),
          key: `${localDateKey(date)}|${prayer}|pre|${before}`,
        });
      }
      if (settings.prayerAlertEnabled) {
        events.push({
          type: "athan",
          prayer,
          minutes: 0,
          at: targetDate(date, athanMinutes),
          key: `${localDateKey(date)}|${prayer}|athan`,
        });
      }
      if (settings.iqamaEnabled) {
        events.push({
          type: "iqama",
          prayer,
          minutes: after,
          at: targetDate(date, athanMinutes + after),
          key: `${localDateKey(date)}|${prayer}|iqama|${after}`,
        });
      }
    }
    return events;
  }

  function dueEvents(times, settings, now = new Date()) {
    const windows = { pre: 15 * 60 * 1000, athan: 15 * 60 * 1000, iqama: 30 * 60 * 1000 };
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return [...buildEvents(times, settings, yesterday), ...buildEvents(times, settings, now)]
      .filter((event) => event.at <= now && now.getTime() - event.at.getTime() <= windows[event.type])
      .sort((a, b) => a.at - b.at);
  }

  return { DEFAULT_SETTINGS, PRAYER_ORDER, normalizeSettings, migrateSettings, parseHHMM, localDateKey, buildEvents, dueEvents };
});
