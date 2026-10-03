// Smoke test for the WebView renderer: loads renderer.generated.ts in headless
// Chromium (the engine behind Android's WebView) with a fake native bridge,
// clicks through every view, and fails on any uncaught error.
//
// Needs `npm run generate-renderer` first and a Chromium/Chrome binary; set
// CHROME_BIN to override the lookup. Skips when no browser is found.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const RENDERER = path.join(__dirname, "..", "renderer.generated.ts");

function findChrome() {
  const candidates = [process.env.CHROME_BIN, "chromium", "chromium-browser", "google-chrome", "google-chrome-stable"];
  for (const bin of candidates.filter(Boolean)) {
    try {
      execFileSync(bin, ["--version"], { stdio: "ignore" });
      return bin;
    } catch {}
  }
  return null;
}

// Runs before the app: records errors and answers the bridge like App.tsx
// (web/bridge.js posts through ReactNativeWebView, replies come via receive()).
const HARNESS_HEAD = `<script>
window.__smoke = { errors: [], messages: [] };
window.SETTINGS = { language: "en", lat: 30.0444, lng: 31.2357, locationSet: true };
addEventListener("error", (e) => __smoke.errors.push(String(e.message)));
addEventListener("unhandledrejection", (e) => __smoke.errors.push("unhandled rejection: " + (e.reason && e.reason.message || e.reason)));
window.ReactNativeWebView = {
  postMessage(raw) {
    const message = JSON.parse(raw);
    __smoke.messages.push(message);
    if (message.type === "load-settings") {
      setTimeout(() => ZakkirNative.receive({ type: "settings", value: SETTINGS, locale: "en" }), 0);
    }
  },
};
</script>`;

// Runs after the app has booted: drives the UI and reports what it saw.
const HARNESS_TAIL = `<script>
setTimeout(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = {};
  const click = (selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error("missing " + selector);
    el.click();
  };
  try {
    checks.home = Boolean(document.querySelector(".home-view .azkar-card"));
    const before = document.querySelector(".azkar-current-count")?.textContent;
    click("#azkarTap");
    await wait(50);
    checks.azkarTapCounts = document.querySelector(".azkar-current-count")?.textContent !== before;

    click(".mobile-bottom-nav [data-go='settings']");
    await wait(50);
    checks.settings = Boolean(document.querySelector(".settings-view"));
    checks.settingsSections = [];
    for (const id of ["general", "reading", "appearance", "notifications"]) {
      click("[data-settings-section='" + id + "']");
      await wait(50);
      if (document.querySelector("[data-settings-panel='" + id + "']")) checks.settingsSections.push(id);
    }

    click(".mobile-bottom-nav [data-go='schedule']");
    await wait(50);
    checks.schedule = Boolean(document.querySelector("#schedBody"));

    checks.backHandled = ZakkirNative.onBack();
    await wait(50);
    checks.backToHome = Boolean(document.querySelector(".home-view"));
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  checks.viewChanges = __smoke.messages.filter((m) => m.type === "view-change").map((m) => m.view);
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

function runPage(tail, settings) {
  const chrome = findChrome();
  if (!chrome) return null;
  assert.ok(fs.existsSync(RENDERER), "run `npm run generate-renderer` first");
  const source = fs.readFileSync(RENDERER, "utf8");
  const html = JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;$/, ""));
  const head = settings
    ? HARNESS_HEAD.replace(/window\.SETTINGS = [^;]*;/, () => `window.SETTINGS = ${JSON.stringify(settings)};`)
    : HARNESS_HEAD;
  // Inject after the charset declaration: placed before it, the head script
  // pushes the meta past the encoding sniff window and the page is misdecoded.
  const charset = '<meta charset="utf-8"/>';
  assert.ok(html.includes(charset), "renderer html declares its charset");
  const page = html.replace(charset, charset + head).replace("</body>", tail + "</body>");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zakkir-smoke-"));
  const file = path.join(dir, "index.html");
  fs.writeFileSync(file, page);
  let dom;
  try {
    dom = execFileSync(chrome, [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
      `--user-data-dir=${path.join(dir, "profile")}`,
      // Keep the test hermetic: every network request fails fast, as offline.
      "--host-resolver-rules=MAP * ~NOTFOUND",
      "--virtual-time-budget=20000",
      "--dump-dom", "file://" + file,
    ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ["ignore", "pipe", "ignore"] });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const match = dom.match(/<pre id="smoke-result">([\s\S]*?)<\/pre>/);
  assert.ok(match, "harness never reported (page failed to boot?)");
  const decoded = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return JSON.parse(decoded);
}

test("renderer boots and every view renders without errors", (t) => {
  const result = runPage(HARNESS_TAIL);
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;

  assert.deepEqual(errors, []);
  assert.equal(checks.home, true, "home view rendered");
  assert.equal(checks.azkarTapCounts, true, "tapping the azkar card counts");
  assert.equal(checks.settings, true, "settings view rendered");
  assert.deepEqual(checks.settingsSections, ["general", "reading", "appearance", "notifications"]);
  assert.equal(checks.schedule, true, "schedule view rendered");
  assert.equal(checks.backHandled, true, "back from schedule is handled in-app");
  assert.equal(checks.backToHome, true, "back returns home");
  // The native shell needs every view change to route the hardware back button.
  assert.deepEqual(checks.viewChanges.slice(-3), ["settings", "schedule", "home"]);
});

// Drives the azkar session through the page's own functions (classic-script
// globals) and reports what the user would see.
const AZKAR_TAIL = `<script>
setTimeout(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = {};
  const tap = () => document.querySelector("#azkarTap").click();
  const count = () => document.querySelector(".azkar-current-count")?.textContent.trim();
  const overall = () => document.querySelector(".azkar-progress-count")?.textContent.trim();
  try {
    update({ view: "home" }, false);
    await wait(50);
    goToAzkar(1, 1); await wait(600);
    checks.secondItemStart = count();
    tap(); await wait(50);
    const target = itemTarget(currentDhikrList()[1]);
    checks.afterTap = count();
    navigateAzkar(1); await wait(600);
    navigateAzkar(-1); await wait(600);
    checks.keptAfterNavigation = count();
    document.querySelector("#resetBtn").click(); await wait(50);
    checks.afterUndo = count();
    checks.overallBefore = overall();
    // Finish every item but the last one, then complete the last by tapping.
    const list = currentDhikrList();
    list.slice(0, -1).forEach((z, i) => { state.azkarCounts[itemKey(i)] = itemTarget(z); });
    checks.overallAllButLast = (render(), await wait(50), overall());
    goToAzkar(list.length - 1, 1); await wait(600);
    for (let i = 0; i < itemTarget(list[list.length - 1]); i += 1) { tap(); await wait(30); }
    await wait(1200);
    checks.summaryShown = Boolean(document.querySelector(".azkar-summary.is-done"));
    checks.summaryText = document.querySelector(".azkar-summary-state")?.textContent.trim();
    // Previous on the first item must not wrap to the end.
    goToAzkar(0, -1); await wait(600);
    navigateAzkar(-1); await wait(600);
    checks.stayedOnFirst = state.azkarIndex === 0;
    // From the summary, tapping jumps to the first unfinished item.
    state.azkarCounts[itemKey(2)] = 0;
    goToAzkar(list.length, 1); await wait(600);
    checks.partialSummary = document.querySelector(".azkar-summary-state")?.textContent.trim();
    tap(); await wait(600);
    checks.jumpedTo = state.azkarIndex;
    checks.target = target;
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

test("azkar session keeps counts, undoes, and ends with a summary", (t) => {
  const result = runPage(AZKAR_TAIL);
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;
  assert.deepEqual(errors, []);
  const { target } = checks;
  assert.equal(checks.secondItemStart, `0 / ${target}`);
  assert.equal(checks.afterTap, `1 / ${target}`);
  assert.equal(checks.keptAfterNavigation, `1 / ${target}`, "count survives moving away and back");
  assert.equal(checks.afterUndo, `0 / ${target}`, "undo takes back one count");
  assert.match(checks.overallBefore, /^0 \/ \d+$/, "progress counts finished items, not position");
  assert.match(checks.overallAllButLast, /^(\d+) \/ (\d+)$/);
  const [, done, total] = checks.overallAllButLast.match(/^(\d+) \/ (\d+)$/);
  assert.equal(Number(done), Number(total) - 1);
  assert.equal(checks.summaryShown, true, "finishing the last item shows the summary");
  assert.equal(checks.summaryText, "Completed");
  assert.equal(checks.stayedOnFirst, true, "Previous on the first item does not wrap");
  assert.match(checks.partialSummary, /^\d+ of \d+ done$/);
  assert.equal(checks.jumpedTo, 2, "tapping the summary resumes at the first unfinished item");
});

// One minutes value per reminder; per-prayer overrides sit behind a disclosure.
const NOTIFY_TAIL = `<script>
setTimeout(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = {};
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const lastSettings = () => __smoke.messages.filter((m) => m.type === "schedule-notifications").pop()?.settings;
  try {
    // Offline there are no prayer times, and nothing is scheduled without them.
    prayers = { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:30", Maghrib: "18:00", Isha: "19:30" };
    document.querySelector(".mobile-bottom-nav [data-go='settings']").click();
    await wait(50);
    document.querySelector("[data-settings-section='notifications']").click();
    await wait(50);
    checks.chips = document.querySelectorAll(".prayer-chip").length;
    checks.customiseClosed = document.querySelector(".prayer-custom").open === false;

    const dhuhr = document.querySelector('[data-prayer-timing="Dhuhr"] [data-prayer-minutes="before"]');
    dhuhr.value = "25"; fire(dhuhr, "input"); fire(dhuhr, "change");
    await wait(50);
    checks.overrideSaved = lastSettings()?.reminderMinutesByPrayer?.Dhuhr;

    const all = document.querySelector("#reminderMinutesAll");
    all.value = "15"; fire(all, "change");
    await wait(50);
    const s = lastSettings();
    checks.globalMinutes = s?.reminderMinutes;
    checks.overridesCleared = Object.keys(s?.reminderMinutesByPrayer || {}).length === 0;
    checks.rowsFollow = [...document.querySelectorAll('[data-prayer-minutes="before"]')].every((i) => i.value === "15");

    document.querySelector('[data-rp="Fajr"]').click();
    await wait(50);
    checks.fajrOff = !lastSettings()?.reminderPrayers?.includes("Fajr");
    checks.chipInactive = !document.querySelector('[data-rp="Fajr"]').closest(".prayer-chip").classList.contains("active");
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

test("notification settings use one minutes value with per-prayer overrides", (t) => {
  const result = runPage(NOTIFY_TAIL);
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;
  assert.deepEqual(errors, []);
  assert.equal(checks.chips, 5, "one chip per prayer");
  assert.equal(checks.customiseClosed, true, "per-prayer rows start collapsed");
  assert.equal(checks.overrideSaved, 25, "a per-prayer override is scheduled");
  assert.equal(checks.globalMinutes, 15);
  assert.equal(checks.overridesCleared, true, "changing the main value resets overrides");
  assert.equal(checks.rowsFollow, true, "per-prayer rows show the new value");
  assert.equal(checks.fajrOff, true, "unticking a prayer chip removes it from the schedule");
  assert.equal(checks.chipInactive, true);
});

// The reading faces are inlined as data URIs; a bad @font-face would silently
// fall back to a system font, so prove each one really loads.
const FONT_TAIL = `<script>
setTimeout(async () => {
  const checks = {};
  try {
    checks.families = [...new Set([...document.fonts].map((f) => f.family.replace(/"/g, "")))].sort();
    checks.loaded = {};
    for (const family of checks.families) {
      const faces = await document.fonts.load('16px "' + family + '"', "أبجد");
      checks.loaded[family] = faces.length > 0 && faces.every((f) => f.status === "loaded");
    }
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

test("every inlined reading font loads", (t) => {
  const result = runPage(FONT_TAIL);
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;
  assert.deepEqual(errors, []);
  assert.deepEqual(checks.families, ["Amiri", "Cairo", "Noto Naskh Arabic", "Scheherazade New"]);
  for (const family of checks.families) assert.equal(checks.loaded[family], true, `${family} loads`);
});

// A fresh install must ask for a location rather than show Cairo's times.
const WELCOME_TAIL = `<script>
setTimeout(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = {};
  try {
    checks.welcome = Boolean(document.querySelector(".welcome-view"));
    checks.noNav = !document.querySelector(".mobile-bottom-nav");
    checks.noPrayerCard = !document.querySelector("#prayerRegion");
    checks.continueDisabled = document.querySelector("#welcomeContinue").disabled;
    checks.shownLocation = document.querySelector(".loc-resolved").textContent.trim();

    document.querySelector('[data-tab="city"]').click();
    await wait(50);
    const country = document.querySelector("#presetCountry");
    country.value = [...country.options].find((o) => o.value)?.value;
    country.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(300);
    checks.continueEnabled = !document.querySelector("#welcomeContinue").disabled;
    checks.saved = __smoke.messages.some((m) => m.type === "save-settings" && m.patch && m.patch.locationSet === true);
    document.querySelector("#welcomeContinue").click();
    await wait(100);
    checks.home = Boolean(document.querySelector(".home-view"));
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

test("first launch asks for a location before showing prayer times", (t) => {
  const result = runPage(WELCOME_TAIL, { language: "en" });
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;
  assert.deepEqual(errors, []);
  assert.equal(checks.welcome, true);
  assert.equal(checks.noNav, true);
  assert.equal(checks.noPrayerCard, true, "no guessed prayer times");
  assert.equal(checks.continueDisabled, true);
  assert.equal(checks.shownLocation, "Not chosen yet");
  assert.equal(checks.continueEnabled, true, "picking a city unlocks Continue");
  assert.equal(checks.saved, true, "the choice is persisted");
  assert.equal(checks.home, true);
});

const DIGITS_TAIL = `<script>
setTimeout(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = {};
  try {
    const text = () => document.querySelector("#app").innerText;
    checks.arabicHome = /[\\u0660-\\u0669]/.test(text()) && !/[0-9]/.test(text());
    document.querySelector("#azkarTap").click();
    await wait(80);
    checks.afterTap = document.querySelector(".azkar-current-count").textContent.trim();
    document.querySelector(".mobile-bottom-nav [data-go='settings']").click();
    await wait(80);
    document.querySelector('[data-digits="latin"]').click();
    await wait(80);
    document.querySelector(".mobile-bottom-nav [data-go='home']").click();
    await wait(80);
    checks.latinAgain = /[0-9]/.test(text()) && !/[\\u0660-\\u0669]/.test(text());
  } catch (e) {
    __smoke.errors.push("harness: " + e.message);
  }
  const out = document.createElement("pre");
  out.id = "smoke-result";
  out.textContent = JSON.stringify({ errors: __smoke.errors, checks });
  document.body.appendChild(out);
}, 3000);
</script>`;

test("Arabic-Indic digits can be switched on and back off", (t) => {
  const result = runPage(DIGITS_TAIL, { language: "ar", arabicDigits: true, lat: 30.0444, lng: 31.2357, locationSet: true });
  if (!result) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  const { errors, checks } = result;
  assert.deepEqual(errors, []);
  assert.equal(checks.arabicHome, true, "no Latin digits remain on the home screen");
  assert.match(checks.afterTap, /^[\u0660-\u0669]+ \/ [\u0660-\u0669]+$/, "counts converted as they change");
  assert.equal(checks.latinAgain, true, "turning the option off restores Latin digits");
});
