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
addEventListener("error", (e) => __smoke.errors.push(String(e.message)));
addEventListener("unhandledrejection", (e) => __smoke.errors.push("unhandled rejection: " + (e.reason && e.reason.message || e.reason)));
window.ReactNativeWebView = {
  postMessage(raw) {
    const message = JSON.parse(raw);
    __smoke.messages.push(message);
    if (message.type === "load-settings") {
      setTimeout(() => ZakkirNative.receive({ type: "settings", value: { language: "en" }, locale: "en" }), 0);
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

test("renderer boots and every view renders without errors", (t) => {
  const chrome = findChrome();
  if (!chrome) return t.skip("no Chromium/Chrome found (set CHROME_BIN)");
  assert.ok(fs.existsSync(RENDERER), "run `npm run generate-renderer` first");

  const source = fs.readFileSync(RENDERER, "utf8");
  const html = JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;$/, ""));
  const page = html
    .replace("<head>", "<head>" + HARNESS_HEAD)
    .replace("</body>", HARNESS_TAIL + "</body>");

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
  const { errors, checks } = JSON.parse(decoded);

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
