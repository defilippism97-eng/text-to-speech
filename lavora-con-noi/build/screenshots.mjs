// Percorre il prototipo in Chromium headless, verifica errori JS e salva screenshot per la documentazione.
// Uso: NODE_PATH=$(npm root -g) node build/screenshots.mjs
import { createRequire } from "module";
import path from "path";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = "file://" + path.join(root, "dist/lavora-con-noi.html");
const out = path.join(root, "docs/img");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
async function run(name, viewport, isMobile) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport, deviceScaleFactor: isMobile ? 2 : 1, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(name + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(name + " console: " + m.text()); });
  await page.goto(url);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForTimeout(2600);
  const shot = async (n, opts = {}) => page.screenshot({ path: path.join(out, `${name}-${n}.jpg`), type: "jpeg", quality: 72, ...opts });
  await shot("01-hero");
  await page.locator("#orientati").scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById("orientati").scrollIntoView());
  await page.waitForTimeout(500);
  await shot("02-step1");
  await page.click('[data-profilo="prima"]');
  await page.waitForTimeout(900);
  await page.fill("#titolo-input", "educaz");
  await page.waitForTimeout(300);
  await shot("03-step2-ricerca");
  await page.keyboard.press("Enter");
  await page.click('[data-quick="diploma_sociale"]');
  await page.waitForTimeout(300);
  await page.click("[data-next]");
  await page.waitForTimeout(900);
  await page.click('[data-settore="disabilita"]');
  await page.click('[data-settore="fragilita"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById("wizard").scrollIntoView());
  await shot("04-step3-ambiti");
  await page.click("[data-next]");
  await page.waitForTimeout(900);
  await page.click('.prov-btn[data-prov="BO"]');
  await page.waitForTimeout(200);
  await page.click('[data-reg="Lombardia"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById("wizard").scrollIntoView());
  await shot("05-step4-mappa");
  await page.click("[data-next]");
  await page.waitForTimeout(1600);
  await shot("06-risultati");
  const n = await page.locator(".service-card").count();
  const first = page.locator("[data-open]").first();
  await first.click();
  await page.waitForTimeout(1200);
  await shot("07-servizio");
  // scorri al primo ruolo e apri un ruolo "near" se c'è
  const near = page.locator(".role-card.near .role-head[aria-expanded=false]").first();
  if (await near.count()) { await near.click(); await near.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); }
  else { await page.locator(".role-card").nth(0).scrollIntoViewIfNeeded(); }
  await page.waitForTimeout(400);
  await shot("08-matching");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById("crescita").scrollIntoView());
  await page.waitForTimeout(1500);
  await shot("09-crescita");
  console.log(name, "servizi trovati:", n);
  await ctx.close();
}
await run("desktop", { width: 1440, height: 900 }, false);
await run("mobile", { width: 390, height: 844 }, true);
await browser.close();
if (errors.length) { console.error("ERRORI:\n" + errors.join("\n")); process.exit(1); }
console.log("OK, nessun errore JS");
