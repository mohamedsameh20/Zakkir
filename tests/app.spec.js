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

test("prayer times can be collapsed and restored", async () => {
  const prayerCard = window.locator("#prayerRegion");
  await prayerCard.locator('.prayer-collapse[aria-label="Minimize prayer times"]').click();
  await expect(prayerCard).toHaveClass(/is-collapsed/);
  await prayerCard.locator('.prayer-collapse[aria-label="Show prayer times"]').click();
  await expect(prayerCard).not.toHaveClass(/is-collapsed/);
});

test("azkar card shows its time-based morning or evening type", async () => {
  const label = window.locator("#azkarTap .azkar-context-copy strong");
  await expect(label).toBeVisible();
  await expect(label).toHaveText(/أذكار (الصباح|المساء)/);
});

test("azkar card keeps only useful progress UI", async () => {
  await expect(window.locator("#catRegion, .azkar-progress-footer, .tap-hint, #navIndicator")).toHaveCount(0);
  await expect(window.locator("#azkarTap .azkar-current-count")).toBeVisible();
  await expect(window.locator("#azkarTap .azkar-overall-track")).toHaveCount(1);
  await expect(window.locator("#azkarTap .azkar-overall-count")).toHaveCount(0);
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
  await window.locator("#presetCountry").waitFor({ state: "attached" });
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
  expect(darkCards).toBeGreaterThan(9);
  const palettes = await window.locator(".palette-grid [data-palette]").count();
  expect(palettes).toBeGreaterThan(3);
});

test("every theme card shows a painted preview swatch", async () => {
  await toSection("appearance");
  const painted = await window.locator(".theme-grid [data-theme-sw]").evaluateAll((els) => {
    return els.map((el) => {
      const cs = getComputedStyle(el);
      const hasScene = !!el.querySelector(".sw-scene");
      const paintedBg = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.backgroundImage !== "none";
      return { theme: el.dataset.themeSw, paintedBg, hasScene };
    });
  });
  expect(painted.length).toBeGreaterThan(50);
  const empty = painted.filter((p) => !p.paintedBg && !p.hasScene);
  expect(empty).toEqual([]);
});

test("appearance theme grid stays inside the window bounds", async () => {
  await toSection("appearance");
  for (const width of [763, 680, 600, 420, 360]) {
    await app.evaluate(({ BrowserWindow }, nextWidth) => {
      BrowserWindow.getAllWindows()[0].setSize(nextWidth, 800);
    }, width);
    await window.waitForTimeout(150);
    const bounds = await window.locator(".settings-section").evaluate((section) => {
      const sectionBox = section.getBoundingClientRect();
      const gridBoxes = [...section.querySelectorAll(".theme-grid")].map((grid) => {
        const box = grid.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      });
      return {
        viewportWidth: window.innerWidth,
        section: { left: sectionBox.left, right: sectionBox.right },
        grids: gridBoxes,
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(bounds.section.left).toBeGreaterThanOrEqual(0);
    expect(bounds.section.right).toBeLessThanOrEqual(bounds.viewportWidth + 1);
    expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.viewportWidth + 1);
    for (const grid of bounds.grids) {
      expect(grid.left).toBeGreaterThanOrEqual(bounds.section.left - 1);
      expect(grid.right).toBeLessThanOrEqual(bounds.section.right + 1);
    }
  }
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(763, 800));
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
  const sounds = await window.locator(".sound-grid .sound-option").count();
  expect(sounds).toBe(7);
  const testBtn = await window.locator("#testSoundBtn").count();
  expect(testBtn).toBe(1);
  const rows = await window.locator(".prayer-timing-row").count();
  expect(rows).toBe(5);
});

test("notifications master switch pauses the config", async () => {
  await toSection("notifications");
  await toggleCheckbox("notificationsEnabled", false);
  await window.waitForTimeout(200);
  const paused = await window.locator(".notification-config.is-paused").count();
  expect(paused).toBe(1);
  const athanDisabled = await window.locator("#prayerAlertEnabled:disabled").count();
  expect(athanDisabled).toBe(1);
  const prayersDisabled = await window.locator("[data-rp]:disabled").count();
  expect(prayersDisabled).toBe(5);
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

test("notifications All/Clear updates prayer toggles", async () => {
  await toSection("notifications");
  await window.locator("[data-prayer-action='clear']").click();
  await window.waitForTimeout(200);
  const cleared = await window.locator("[data-rp]:checked").count();
  expect(cleared).toBe(0);
  const summary = await window.locator(".notification-confirmation p").textContent();
  expect(summary).toContain("at least one prayer");
  await window.locator("[data-prayer-action='all']").click();
  await window.waitForTimeout(200);
  const allChecked = await window.locator("[data-rp]:checked").count();
  expect(allChecked).toBe(5);
  const onTiles = await window.locator("[data-prayer-timing].on").count();
  expect(onTiles).toBe(5);
});

test("notification timing inputs support every minute", async () => {
  await toSection("notifications");
  const fajrBefore = window.locator('[data-prayer-timing="Fajr"] input[data-prayer-minutes="before"]');
  const maghribAfter = window.locator('[data-prayer-timing="Maghrib"] input[data-prayer-minutes="after"]');
  await fajrBefore.fill("7");
  await maghribAfter.fill("13");

  await expect(fajrBefore).toHaveAttribute("min", "1");
  await expect(fajrBefore).toHaveAttribute("max", "60");
  await expect(fajrBefore).toHaveValue("7");
  await expect(maghribAfter).toHaveValue("13");
});

test("notification timing offers independent controls for each prayer", async () => {
  await toSection("notifications");
  await expect(window.locator(".prayer-timing-list")).toBeVisible();
  await expect(window.locator("[data-prayer-timing]")).toHaveCount(5);
  await expect(window.locator('[data-prayer-timing="Fajr"] input[data-prayer-minutes="before"]')).toHaveAttribute("min", "1");
  await expect(window.locator('[data-prayer-timing="Maghrib"] input[data-prayer-minutes="after"]')).toHaveAttribute("max", "60");
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
  const dhikrBefore = await window.locator("#azkarTap .dhikr").textContent();
  const overallBefore = await window.locator("#azkarTap .azkar-overall-track").getAttribute("aria-valuenow");
  await window.locator("[data-nav='1']").click();
  await window.waitForTimeout(500);
  const dhikrAfter = await window.locator("#azkarTap .dhikr").textContent();
  const overallAfter = await window.locator("#azkarTap .azkar-overall-track").getAttribute("aria-valuenow");
  expect(dhikrAfter).not.toBe(dhikrBefore);
  expect(overallAfter).not.toBe(overallBefore);
});

test("azkar prev button works", async () => {
  const dhikrBefore = await window.locator("#azkarTap .dhikr").textContent();
  const overallBefore = await window.locator("#azkarTap .azkar-overall-track").getAttribute("aria-valuenow");
  await window.locator("[data-nav='-1']").click();
  await window.waitForTimeout(500);
  const dhikrAfter = await window.locator("#azkarTap .dhikr").textContent();
  const overallAfter = await window.locator("#azkarTap .azkar-overall-track").getAttribute("aria-valuenow");
  expect(dhikrAfter).not.toBe(dhikrBefore);
  expect(overallAfter).not.toBe(overallBefore);
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
