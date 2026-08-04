const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEvents, dueEvents, migrateSettings } = require("../notification-scheduler");

const times = { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "23:55" };

test("migrates legacy toggles and honors independent event settings", () => {
  const migrated = migrateSettings({ reminderEnabled: true, athanEnabled: false, iqamaEnabled: true, reminderPrayers: ["Fajr"] });
  assert.equal(migrated.remindersEnabled, true);
  assert.equal(migrated.prayerAlertEnabled, false);
  assert.deepEqual(buildEvents(times, migrated, new Date(2026, 7, 4)).map((event) => event.type), ["pre", "iqama"]);
});

test("uses per-prayer overrides and suppresses all events under the master toggle", () => {
  const settings = { reminderPrayers: ["Fajr"], remindersEnabled: true, prayerAlertEnabled: false, iqamaEnabled: true, reminderMinutesByPrayer: { Fajr: 20 }, iqamaMinutesByPrayer: { Fajr: 15 } };
  assert.deepEqual(buildEvents(times, settings, new Date(2026, 7, 4)).map((event) => event.minutes), [20, 15]);
  assert.deepEqual(buildEvents(times, { ...settings, notificationsEnabled: false }, new Date(2026, 7, 4)), []);
});

test("recovers delayed ticks and previous-day events after midnight", () => {
  const athan = dueEvents(times, { reminderPrayers: ["Dhuhr"], prayerAlertEnabled: true }, new Date(2026, 7, 4, 12, 10));
  assert.equal(athan[0].key, "2026-08-04|Dhuhr|athan");
  const iqama = dueEvents(times, { reminderPrayers: ["Isha"], prayerAlertEnabled: false, iqamaEnabled: true, iqamaMinutes: 10 }, new Date(2026, 7, 5, 0, 7));
  assert.equal(iqama[0].key, "2026-08-04|Isha|iqama|10");
});
