// @ts-check
const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");

let app;
let window;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, "..")],
    env: { ...process.env, NODE_ENV: "test" },
  });
  window = await app.firstWindow();
  // Wait for the app to finish initial render
  await window.waitForSelector("#app", { timeout: 10000 });
  // Give it a moment to load azkar and prayer data
  await window.waitForTimeout(2000);
});

test.afterAll(async () => {
  if (app) await app.close();
});

// Navigate to the settings view if not already there, then to the given section.
// Each settings test is self-contained so ordering stays robust.
async function toSection(section) {
  const inSettings = await window.locator(".settings-nav").count();
  if (inSettings === 0) {
    await window.locator("[data-go='settings']").click();
    await window.waitForTimeout(400);
  }
  await window.locator(`[data-settings-section="${section}"]`).click();
  await window.waitForTimeout(300);
}

// The styled switches hide their <input> (opacity:0, 0x0) so we toggle state
// and dispatch a change event directly instead of clicking an invisible box.
async function toggleCheckbox(id, checked) {
  await window.locator(`#${id}`).evaluate((el, on) => {
    if (el.checked !== on) {
      el.checked = on;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, checked);
}

// Return to the home view from anywhere (home, settings, schedule, map).
async function toHome() {
  const onHome = await window.locator(".brand .name").count();
  if (onHome === 1) return;
  await window.locator("[data-go='home']").click();
  await window.waitForTimeout(300);
}

// --- Launch & Home View ---

test("app window opens", async () => {
  const title = await window.title();
  expect(title).toBe("Zakkir");
});

test("home view renders brand header", async () => {
  const brand = await window.locator(".brand .name").textContent();
  expect(brand).toBe("Zakkir");
});

test("home view shows prayer grid", async () => {
  const prayers = await window.locator(".prayer-grid .prayer").count();
  expect(prayers).toBe(5); // Fajr, Dhuhr, Asr, Maghrib, Isha
});

test("home view shows azkar section", async () => {
  const tap = await window.locator("#azkarTap").count();
  expect(tap).toBe(1);
});

test("minimize button exists", async () => {
  const btn = await window.locator("#minimizeBtn").count();
  expect(btn).toBe(1);
});

test("close button exists", async () => {
  const btn = await window.locator("#closeBtn").count();
  expect(btn).toBe(1);
});

// --- Navigation to Settings ---

test("navigate to settings view", async () => {
  await toSection("general");
  const backBtn = await window.locator("[data-go='home']").count();
  expect(backBtn).toBeGreaterThanOrEqual(1);
});

test("settings view renders location tabs and city input", async () => {
  await toSection("general");
  await window.locator("[data-tab='city']").click();
  await window.waitForTimeout(300);
  const country = await window.locator("#presetCountry").count();
  const city = await window.locator("#presetCity").count();
  expect(country).toBe(1);
  expect(city).toBe(1);
  const tabs = await window.locator("[data-tab='gps'], [data-tab='map'], [data-tab='city']").count();
  expect(tabs).toBe(3);
});

test("settings view renders advanced coordinates controls", async () => {
  await toSection("general");
  const lat = await window.locator("#latInput").count();
  const lng = await window.locator("#lngInput").count();
  const use = await window.locator("#useCoordsBtn").count();
  expect(lat + lng + use).toBe(3);
});

test("appearance section renders theme grids with dark counterparts", async () => {
  await toSection("appearance");
  const themes = await window.locator(".theme-grid [data-theme]").count();
  expect(themes).toBeGreaterThan(5);
  const darkCards = await window.locator('.theme-grid [data-theme$="-dark"]').count();
  expect(darkCards).toBeGreaterThanOrEqual(9);
  const palettes = await window.locator(".palette-grid [data-palette]").count();
  expect(palettes).toBeGreaterThan(3);
});

test("frutiger is the default theme", async () => {
  await toSection("appearance");
  const htmlClass = await window.evaluate(() => document.documentElement.className);
  expect(htmlClass).toContain("theme-frutiger");
  const active = await window.locator('[data-theme="frutiger"].active').count();
  expect(active).toBe(1);
});

test("reading section renders local fonts", async () => {
  await toSection("reading");
  const fonts = await window.locator(".font-grid [data-font]").count();
  expect(fonts).toBe(10);
  const active = await window.locator('[data-font="Scheherazade"].active').count();
  expect(active).toBe(1);
  const size = await window.locator("#arSize").count();
  expect(size).toBe(1);
});

test("notifications section renders master switch and sound picker", async () => {
  await toSection("notifications");
  const master = await window.locator("#notificationsEnabled").count();
  expect(master).toBe(1);
  expect(await window.locator("#remindersEnabled").count()).toBe(1);
  expect(await window.locator("#prayerAlertEnabled").count()).toBe(1);
  expect(await window.locator("#iqamaEnabled").count()).toBe(1);
  const sounds = await window.locator(".sound-grid .sound-option").count();
  expect(sounds).toBe(6);
  const testBtn = await window.locator("#testSoundBtn").count();
  expect(testBtn).toBe(1);
  expect(await window.locator(".athan-line").count()).toBe(3);
});

test("notifications master switch pauses the config", async () => {
  await toSection("notifications");
  await toggleCheckbox("notificationsEnabled", false);
  await window.waitForTimeout(200);
  const paused = await window.locator(".notification-config.is-paused").count();
  expect(paused).toBe(1);
  const disabledToggles = await window.locator("#remindersEnabled:disabled, #prayerAlertEnabled:disabled, #iqamaEnabled:disabled").count();
  expect(disabledToggles).toBe(3);
  const summary = await window.locator(".notification-confirmation p").textContent();
  expect(summary).toContain("paused");
  const pausedConf = await window.locator(".notification-confirmation.paused").count();
  expect(pausedConf).toBe(1);
  // restore
  await toggleCheckbox("notificationsEnabled", true);
  await window.waitForTimeout(200);
  const resumed = await window.locator(".notification-config.is-paused").count();
  expect(resumed).toBe(0);
});

test("notification event toggles update the summary", async () => {
  await toSection("notifications");
  await toggleCheckbox("remindersEnabled", false);
  await window.waitForTimeout(200);
  const summary = await window.locator(".notification-confirmation p").textContent();
  expect(summary).not.toContain("before athan");
  await toggleCheckbox("iqamaEnabled", true);
  await window.waitForTimeout(200);
  const updated = await window.locator(".notification-confirmation p").textContent();
  expect(updated).toContain("after athan");
});

test("notification prayer selection remains configurable", async () => {
  await toSection("notifications");
  expect(await window.locator("[data-rp]:checked").count()).toBeGreaterThan(0);
  await window.locator("[data-rp]").first().uncheck();
  const summary = await window.locator(".notification-confirmation p").textContent();
  expect(summary).not.toContain("Fajr");
});

test("window section renders zoom and size sliders", async () => {
  await toSection("window");
  const zoomBtns = await window.locator(".zoom-btn").count();
  expect(zoomBtns).toBe(2);
  const width = await window.locator("#popupW").count();
  const height = await window.locator("#popupH").count();
  expect(width + height).toBe(2);
});

// --- Theme Switching (the reported freeze scenario) ---

test("switch to light theme without freeze", async () => {
  await toSection("appearance");
  await window.locator(".settings-advanced summary").click();
  await window.waitForTimeout(200);
  await window.locator("[data-theme='light']").click();
  await window.waitForTimeout(300);
  const active = await window.locator("[data-theme='light'].active").count();
  expect(active).toBe(1);
  const htmlClass = await window.evaluate(() => document.documentElement.className);
  expect(htmlClass).toContain("theme-light");
});

test("switch to dark theme without freeze", async () => {
  await toSection("appearance");
  await window.locator(".settings-advanced summary").click();
  await window.waitForTimeout(200);
  await window.locator("[data-theme='dark']").click();
  await window.waitForTimeout(300);
  const active = await window.locator("[data-theme='dark'].active").count();
  expect(active).toBe(1);
  const htmlClass = await window.evaluate(() => document.documentElement.className);
  expect(htmlClass).toContain("theme-dark");
});

// --- Navigate Back to Home ---

test("navigate back to home view", async () => {
  await toSection("general");
  await window.locator("[data-go='home']").click();
  await window.waitForTimeout(500);
  const brand = await window.locator(".brand .name").textContent();
  expect(brand).toBe("Zakkir");
});

test("home view still shows prayers after round-trip", async () => {
  const prayers = await window.locator(".prayer-grid .prayer").count();
  expect(prayers).toBe(5);
});

// --- Azkar Navigation ---

test("azkar next button works", async () => {
  const navBefore = await window.locator("#navIndicator").textContent();
  await window.locator("[data-nav='1']").click();
  await window.waitForTimeout(300);
  const navAfter = await window.locator("#navIndicator").textContent();
  expect(navAfter).not.toBe(navBefore);
});

test("azkar prev button works", async () => {
  const navBefore = await window.locator("#navIndicator").textContent();
  await window.locator("[data-nav='-1']").click();
  await window.waitForTimeout(300);
  const navAfter = await window.locator("#navIndicator").textContent();
  expect(navAfter).not.toBe(navBefore);
});

// --- Settings Round-Trip Stress Test (freeze detection) ---

test("rapid settings section switching does not freeze", async () => {
  await toSection("general");
  for (let i = 0; i < 2; i++) {
    for (const s of ["general", "notifications", "reading", "appearance", "window"]) {
      await window.locator(`[data-settings-section="${s}"]`).click();
      await window.waitForTimeout(120);
    }
  }
  const panels = await window.locator("[data-settings-panel]").count();
  expect(panels).toBe(1);
});

test("rapid settings toggle does not freeze", async () => {
  await toHome();
  for (let i = 0; i < 5; i++) {
    await window.locator("[data-go='settings']").click();
    await window.waitForTimeout(200);
    await window.locator("[data-go='home']").click();
    await window.waitForTimeout(200);
  }
  // If we got here without timeout, the app didn't freeze
  const brand = await window.locator(".brand .name").textContent();
  expect(brand).toBe("Zakkir");
});
