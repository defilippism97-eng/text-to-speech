// Estrae dal prototipo (dist/lavora-con-noi.html) i testi generali così come appaiono nella pagina.
// Output: data/testi-generali.json, usato da build/build_testi_docx.mjs.
// Uso: NODE_PATH=$(npm root -g) node build/estrai_testi.mjs
import { createRequire } from "module";
import path from "path";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await page.goto("file://" + path.join(root, "dist/lavora-con-noi.html"));
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload();
await page.waitForTimeout(600);

// righe di testo di un elemento, senza duplicati consecutivi
const righe = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return [];
  return el.innerText.split("\n").map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean)
    .filter((t, i, a) => t !== a[i - 1]);
}, sel);

const out = {};
out.banner = await righe(".proto-banner");
out.menu = await righe(".main-nav");
out.headerCta = await righe(".header-cta");
out.hero = await righe(".hero-copy");
out.heroAlt = await page.evaluate(() => document.querySelector(".hero-media img")?.alt || "");
out.perche = await righe("#perche");
out.numeri = await righe(".numbers .container");
out.orientamentoIntro = await righe(".orient-head");

// passi del percorso
const steps = {};
steps.passo1 = await righe("#wizard-stage");
await page.click('[data-profilo="prima"]');
await page.waitForTimeout(600);
steps.passo2 = await righe("#wizard-stage");
await page.click("[data-next]"); await page.waitForTimeout(300);
steps.passo3 = await righe("#wizard-stage");
await page.click("[data-next]"); await page.waitForTimeout(300);
steps.passo4 = await righe(".step-panel > :not(.geo)") ;
steps.passo4 = await page.evaluate(() => {
  const st = document.querySelector("#wizard-stage");
  const take = (sel) => [...st.querySelectorAll(sel)].map((n) => n.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);
  return [...take(".step-count, .step-title, .step-desc"), ...take(".geo-side h4, .sede-legend, .geo-anywhere .o-label, .geo-anywhere .o-hint"), ...take(".step-nav button")];
});
await page.click("[data-next]"); await page.waitForTimeout(500);
steps.passo5 = await righe("#wizard-stage");
steps.risultatiIntro = await page.evaluate(() => {
  const h = document.querySelector(".results-head");
  return h ? [...h.querySelectorAll(".eyebrow, h2, .section-lead")].map((n) => n.innerText.replace(/\s+/g, " ").trim()) : [];
});
out.passi = steps;

// percorsi di crescita: tutte le schede
out.crescitaIntro = await page.evaluate(() => [...document.querySelectorAll("#crescita .eyebrow, #crescita h2, #crescita .section-lead")].map((n) => n.innerText.trim()));
out.formazione = await righe("#formazione");
out.storie = await righe("#storie");
out.ctaFinale = await righe(".final-cta");
out.footer = await righe(".site-footer");

// modali
const modali = {};
for (const [k, sel] of [["candidaturaSpontanea", '[data-action="spontanea"]'], ["segnalazione", '[data-action="segnala"]'], ["offerte", '.header-cta']]) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click(sel); await page.waitForTimeout(300);
  modali[k] = await righe("#modal-inner");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
}
out.modali = modali;

await browser.close();
fs.writeFileSync(path.join(root, "data/testi-generali.json"), JSON.stringify(out, null, 1));
console.log("data/testi-generali.json", Object.keys(out).join(", "));
