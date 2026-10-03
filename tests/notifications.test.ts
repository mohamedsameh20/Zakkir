import test from "node:test";
import assert from "node:assert/strict";
import {
  cachedDays, clampMinutes, dateKey, MAX_DAYS, notificationsWanted, parseHHMM, planNotifications, selectedPrayers,
} from "../src/notifications/plan.ts";
import { pickMessage } from "../src/notifications/messages.ts";
import { channelIdFor, resolveSoundId, soundResource } from "../src/notifications/sounds.ts";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const at = (date: Date, h: number, min: number) => { const x = new Date(date); x.setHours(h, min, 0, 0); return x; };
const times = { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "19:30" };
const first = () => 0; // always pick the first message

test("clampMinutes keeps 1..60 and falls back for junk", () => {
  assert.equal(clampMinutes(15, 10), 15);
  assert.equal(clampMinutes("7.9", 10), 7);
  assert.equal(clampMinutes(90, 10), 60);
  assert.equal(clampMinutes(0, 10), 10);
  assert.equal(clampMinutes("x", 99), 60);
});

test("parseHHMM accepts AlAdhan formats and rejects the rest", () => {
  assert.deepEqual(parseHHMM("04:23 (EET)"), [4, 23]);
  assert.deepEqual(parseHHMM("5:07"), [5, 7]);
  assert.equal(parseHHMM("24:00"), null);
  assert.equal(parseHHMM(undefined), null);
});

test("selected prayers come from a list or a name->bool map", () => {
  assert.deepEqual(selectedPrayers({ reminderPrayers: ["Fajr", "Isha"] }), ["Fajr", "Isha"]);
  assert.deepEqual(selectedPrayers({ reminderPrayers: { Fajr: true, Dhuhr: false, Asr: 1 } }), ["Fajr", "Asr"]);
  assert.equal(notificationsWanted({ reminderPrayers: [] }), false);
  assert.equal(notificationsWanted({ reminderPrayers: ["Fajr"], notificationsEnabled: false }), false);
  assert.equal(notificationsWanted({ reminderPrayers: ["Fajr"] }), true);
});

test("plans athan, reminder and iqama at the right minutes", () => {
  const d = day(2026, 10, 3);
  const plan = planNotifications([{ date: d, times }], {
    reminderPrayers: ["Asr"], prayerAlertEnabled: true, remindersEnabled: true, iqamaEnabled: true,
    reminderMinutesByPrayer: { Asr: 15 }, iqamaMinutes: 20,
  }, at(d, 0, 0), first);
  assert.deepEqual(plan.map((n) => [n.type, n.date.getHours(), n.date.getMinutes()]), [
    ["athan", 15, 30], ["pre", 15, 15], ["iqama", 15, 50],
  ]);
  assert.equal(plan[0].title, pickMessage("Asr", false, first).title);
  assert.equal(plan[1].title, `${pickMessage("Asr", true, first).title} (in 15 min)`);
  assert.equal(plan[2].title, "إقامة صلاة العصر");
});

test("legacy toggles still enable athan and reminders", () => {
  const d = day(2026, 10, 3);
  const plan = planNotifications([{ date: d, times }], { reminderPrayers: ["Fajr"], athanEnabled: true, reminderEnabled: true }, at(d, 0, 0), first);
  assert.deepEqual(plan.map((n) => n.type), ["athan", "pre"]);
});

test("Arabic reminders use Arabic plural forms", () => {
  const d = day(2026, 10, 3);
  const titles = [1, 2, 5, 15].map((before) =>
    planNotifications([{ date: d, times }], { reminderPrayers: ["Dhuhr"], remindersEnabled: true, language: "ar", reminderMinutes: before }, at(d, 0, 0), first)[0].title);
  assert.match(titles[0], /\(متبقي 1 دقيقة\)$/);
  assert.match(titles[1], /\(متبقي 2 دقيقتين\)$/);
  assert.match(titles[2], /\(متبقي 5 دقائق\)$/);
  assert.match(titles[3], /\(متبقي 15 دقيقة\)$/);
});

test("past notifications are skipped", () => {
  const d = day(2026, 10, 3);
  const plan = planNotifications([{ date: d, times }], { reminderPrayers: ["Fajr", "Isha"], prayerAlertEnabled: true }, at(d, 12, 0), first);
  assert.deepEqual(plan.map((n) => n.prayer), ["Isha"]);
});

test("unparseable times are ignored", () => {
  const d = day(2026, 10, 3);
  const plan = planNotifications([{ date: d, times: { Fajr: "soon" } }], { reminderPrayers: ["Fajr"], prayerAlertEnabled: true }, at(d, 0, 0), first);
  assert.deepEqual(plan, []);
});

test("cached days cover today onward within the rolling window", () => {
  const today = day(2026, 10, 3);
  const upcoming: Record<string, unknown> = {};
  for (let i = -2; i < MAX_DAYS + 5; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    upcoming[dateKey(d)] = times;
  }
  const days = cachedDays({ upcomingTimings: upcoming }, at(today, 13, 45));
  assert.equal(days.length, MAX_DAYS);
  assert.equal(dateKey(days[0].date), "2026-10-03");
  assert.equal(days[0].date.getHours(), 0);
  assert.equal(dateKey(days[MAX_DAYS - 1].date), "2026-10-30");
});

test("a full window stays under Android's 500-alarm limit", () => {
  const today = day(2026, 10, 3);
  const upcoming: Record<string, unknown> = {};
  for (let i = 0; i < MAX_DAYS; i++) { const d = new Date(today); d.setDate(today.getDate() + i); upcoming[dateKey(d)] = times; }
  const settings = { upcomingTimings: upcoming, reminderPrayers: Object.keys(times), prayerAlertEnabled: true, remindersEnabled: true, iqamaEnabled: true };
  assert.ok(planNotifications(cachedDays(settings, today), settings, at(today, 0, 0), first).length <= 500);
});

test("sounds map to stable channels and res/raw names", () => {
  assert.equal(resolveSoundId("bell"), "bell");
  assert.equal(resolveSoundId("silent"), "silent");
  assert.equal(resolveSoundId("adhan-1"), "chime"); // removed sound falls back
  assert.equal(soundResource("soft-ping"), "soft_ping.mp3");
  assert.equal(channelIdFor("soft-ping"), "prayer-reminders-soft_ping");
});
