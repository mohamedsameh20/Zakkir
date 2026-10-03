const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright");

const ts = fs.readFileSync("/mnt/local_disk/zakkir_desktop/mobile/renderer.generated.ts", "utf8");
const html = ts.replace(/^export const rendererHtml = /, "").replace(/;?\s*$/, "");
const decoded = JSON.parse(html);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(decoded);
});
server.listen(0, () => run());

async function run() {
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: "/home/mohamed/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    window.__ZAKKIR_LOCALE__ = "ar";
    window.ReactNativeWebView = { postMessage: () => {} };
  });
  await page.goto(`http://localhost:${port}`);
  await page.waitForTimeout(4000);

  const info = await page.evaluate(() => {
    const liquid = document.querySelector(".mobile-nav-liquid");
    const nav = document.querySelector(".mobile-bottom-nav");
    return {
      dir: document.documentElement.dir,
      lang: document.documentElement.lang,
      navIndex: liquid ? getComputedStyle(liquid).getPropertyValue("--nav-index") : null,
      transform: liquid ? getComputedStyle(liquid).transform : null,
      right: liquid ? getComputedStyle(liquid).right : null,
      left: liquid ? getComputedStyle(liquid).left : null,
      navDisplay: nav ? getComputedStyle(nav).display : null,
      activeBtn: document.querySelector(".mobile-bottom-nav-btn.active")?.getAttribute("data-go"),
    };
  });
  console.log("INITIAL:", JSON.stringify(info));

  async function clickNav(go, label) {
    await page.evaluate((g) => document.querySelector(`.mobile-bottom-nav-btn[data-go="${g}"]`).click(), go);
    await page.waitForTimeout(900);
    const res = await page.evaluate(() => {
      const liquid = document.querySelector(".mobile-nav-liquid");
      return {
        navIndex: liquid ? getComputedStyle(liquid).getPropertyValue("--nav-index") : null,
        transform: liquid ? getComputedStyle(liquid).transform : null,
        activeBtn: document.querySelector(".mobile-bottom-nav-btn.active")?.getAttribute("data-go"),
        view: document.querySelector("#app .app")?.className,
      };
    });
    console.log(`AFTER ${label}:`, JSON.stringify(res));
  }

  await clickNav("schedule", "schedule");
  await clickNav("settings", "settings");
  await clickNav("home", "home");

  await browser.close();
  server.close();
  process.exit(0);
}
