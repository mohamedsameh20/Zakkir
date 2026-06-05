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
  await window.locator("[data-go='settings']").click();
  await window.waitForTimeout(500);
  const backBtn = await window.locator("[data-go='home']").count();
  expect(backBtn).toBeGreaterThanOrEqual(1);
});

test("settings view renders city input", async () => {
  const city = await window.locator("#presetCity").inputValue();
  expect(city).toBeTruthy();
});

test("settings view renders theme grid", async () => {
  const themes = await window.locator(".theme-grid [data-theme]").count();
  expect(themes).toBeGreaterThan(5);
});

test("settings view renders font grid", async () => {
  const fonts = await window.locator(".font-grid [data-font]").count();
  expect(fonts).toBeGreaterThan(3);
});

test("settings view renders palette grid", async () => {
  const palettes = await window.locator(".palette-grid [data-palette]").count();
  expect(palettes).toBeGreaterThan(3);
});

// --- Theme Switching (the reported freeze scenario) ---

test("switch to light theme without freeze", async () => {
  await window.locator("[data-theme='light']").click();
  await window.waitForTimeout(300);
  const active = await window.locator("[data-theme='light'].active").count();
  expect(active).toBe(1);
});

test("switch to dark theme without freeze", async () => {
  await window.locator("[data-theme='dark']").click();
  await window.waitForTimeout(300);
  const active = await window.locator("[data-theme='dark'].active").count();
  expect(active).toBe(1);
});

// --- Navigate Back to Home ---

test("navigate back to home view", async () => {
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

test("rapid settings toggle does not freeze", async () => {
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
