const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildEvents,
  dueEvents,
  migrateSettings,
  normalizeSettings,
} = require("../notification-scheduler");

const times = { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "23:55" };

test("legacy event toggles migrate without changing preferences", () => {
  const settings = migrateSettings({ reminderEnabled: true, athanEnabled: false });
  assert.equal(settings.remindersEnabled, true);
  assert.equal(settings.prayerAlertEnabled, false);
  assert.equal("reminderEnabled" in settings, false);
  assert.equal("athanEnabled" in settings, false);
});

test("event toggles independently control generated events", () => {
  const settings = { reminderPrayers: ["Fajr"], remindersEnabled: true, prayerAlertEnabled: false, iqamaEnabled: true };
  assert.deepEqual(buildEvents(times, settings, new Date(2026, 7, 4)).map((event) => event.type), ["pre", "iqama"]);
  assert.deepEqual(buildEvents(times, { ...settings, notificationsEnabled: false }, new Date(2026, 7, 4)), []);
});

test("per-prayer minute values override defaults", () => {
  const events = buildEvents(times, {
    reminderPrayers: ["Fajr"],
    remindersEnabled: true,
    prayerAlertEnabled: false,
    iqamaEnabled: true,
    reminderMinutes: 10,
    reminderMinutesByPrayer: { Fajr: 20 },
    iqamaMinutes: 10,
    iqamaMinutesByPrayer: { Fajr: 15 },
  }, new Date(2026, 7, 4));
  assert.deepEqual(events.map((event) => event.minutes), [20, 15]);
});

test("delayed ticks recover once inside each valid event window", () => {
  const settings = normalizeSettings({ reminderPrayers: ["Dhuhr"], remindersEnabled: false, prayerAlertEnabled: true });
  const due = dueEvents(times, settings, new Date(2026, 7, 4, 12, 10));
  assert.equal(due.length, 1);
  assert.equal(due[0].key, "2026-08-04|Dhuhr|athan");
  assert.equal(dueEvents(times, settings, new Date(2026, 7, 4, 12, 16)).length, 0);
});

test("iqama events can cross midnight without changing their prayer date key", () => {
  const settings = { reminderPrayers: ["Isha"], remindersEnabled: false, prayerAlertEnabled: false, iqamaEnabled: true, iqamaMinutes: 10 };
  const due = dueEvents(times, settings, new Date(2026, 7, 5, 0, 7));
  assert.equal(due.length, 1);
  assert.equal(due[0].key, "2026-08-04|Isha|iqama|10");
});
