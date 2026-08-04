const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEvents, dueEvents, migrateSettings } = require("./notification-scheduler");

const times = { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "23:55" };

test("migrates Firefox legacy toggles and prayer object selections", () => {
  const migrated = migrateSettings({ reminderEnabled: true, athanEnabled: false, reminderPrayers: { Fajr: true, Dhuhr: false } });
  assert.equal(migrated.remindersEnabled, true);
  assert.equal(migrated.prayerAlertEnabled, false);
  assert.deepEqual(migrated.reminderPrayers, ["Fajr"]);
});

test("honors independent toggles, overrides, and the master toggle", () => {
  const settings = { reminderPrayers: ["Fajr"], remindersEnabled: true, prayerAlertEnabled: false, iqamaEnabled: true, reminderMinutesByPrayer: { Fajr: 20 }, iqamaMinutesByPrayer: { Fajr: 15 } };
  const events = buildEvents(times, settings, new Date(2026, 7, 4));
  assert.deepEqual(events.map((event) => event.type), ["pre", "iqama"]);
  assert.deepEqual(events.map((event) => event.minutes), [20, 15]);
  assert.deepEqual(buildEvents(times, { ...settings, notificationsEnabled: false }, new Date(2026, 7, 4)), []);
});

test("recovers delayed ticks and prior-day iqama after midnight", () => {
  const delayed = dueEvents(times, { reminderPrayers: ["Dhuhr"], prayerAlertEnabled: true }, new Date(2026, 7, 4, 12, 10));
  assert.equal(delayed[0].key, "2026-08-04|Dhuhr|athan");
  const midnight = dueEvents(times, { reminderPrayers: ["Isha"], prayerAlertEnabled: false, iqamaEnabled: true, iqamaMinutes: 10 }, new Date(2026, 7, 5, 0, 7), times);
  assert.equal(midnight[0].key, "2026-08-04|Isha|iqama|10");
});
