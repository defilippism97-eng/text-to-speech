// Test della versione di revisione «locale» (dist/netlify/index.html): proposte nel browser,
// nome dell'autore, persistenza dopo ricarica, avviso in uscita, export CSV, svuotamento.
// Uso: NODE_PATH=$(npm root -g) node build/test_editor_locale.mjs [cartella-screenshot]
import { createRequire } from "module";
import path from "path";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const shots = process.argv[2];
const url = "file://" + path.join(root, "dist/netlify/index.html");
const nb = (t) => t.replace(/\s+/g, " ");
const ok = [], errors = [];
const check = (c, m) => (c ? ok.push(m) : errors.push("FALLITO: " + m));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", acceptDownloads: true });
let page = await ctx.newPage();
const dialoghi = [];
const ascolta = (p) => { p.on("dialog", (d) => { dialoghi.push(d.type()); d.accept(); }); p.on("pageerror", (e) => errors.push("JS: " + e.message)); };
ascolta(page);
await page.goto(url);
await page.waitForTimeout(600);
check((await page.locator(".ed-strip").innerText()).includes("marco.defilippis@societadolce.it"), "la striscia indica a chi inviare il file");
check(await page.evaluate(() => !window.claude), "nessuna dipendenza da claude.ai");

// prima proposta: viene chiesto il nome
await page.click('[data-ed="mode"]');
await page.click("#hero-title");
check(await page.locator("#ed-autore").count() === 1, "la prima volta viene chiesto il nome");
await page.fill("#ed-text", "Scopri chi puoi diventare con Società Dolce.");
await page.click('[data-pop="save"]');
await page.waitForTimeout(200);
check(await page.locator(".ed-pop:not([hidden])").count() === 1, "senza nome non si salva");
await page.fill("#ed-autore", "Giulia Bianchi");
await page.click('[data-pop="save"]');
await page.waitForTimeout(300);
check(nb(await page.locator("#hero-title").innerText()).includes("con Società Dolce"), "proposta applicata in anteprima");
check((await page.locator(".ed-status").innerText()).includes("non ancora esportate"), "promemoria: proposte non esportate");
check(await page.locator('[data-ed="export"].ed-attn').count() === 1, "pulsante Esporta evidenziato");
if (shots) await page.screenshot({ path: path.join(shots, "loc-1.png") });

// ricarica: avviso in uscita e proposte ancora presenti
await page.reload();
await page.waitForTimeout(600);
check(dialoghi.includes("beforeunload"), "avviso del browser se si esce senza esportare");
check(nb(await page.locator("#hero-title").innerText()).includes("con Società Dolce"), "la proposta resta dopo aver ricaricato la pagina");
await page.click('[data-ed="mode"]');
await page.locator(".hero-sub").click();
check(await page.locator("#ed-autore").count() === 0, "il nome non viene richiesto di nuovo");
await page.fill("#ed-text", "Da oltre 35 anni nei servizi alla persona.");
await page.fill("#ed-nota", "Frase più breve");
await page.click('[data-pop="save"]');
await page.waitForTimeout(200);

// export
await page.click('[data-ed="export"]');
check((await page.locator(".ed-panel").innerText()).includes("marco.defilippis@societadolce.it"), "il pannello di export indica l'indirizzo");
check(await page.locator('.ed-panel a[href^="mailto:marco.defilippis@societadolce.it"]').count() === 1, "pulsante per scrivere la mail a Marco");
if (shots) await page.screenshot({ path: path.join(shots, "loc-2-export.png") });
const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-ex="csv"]')]);
const file = await dl.path();
const csv = fs.readFileSync(file, "utf8");
check(dl.suggestedFilename().startsWith("proposte-testi-lavora-con-noi-giulia-bianchi-") && dl.suggestedFilename().endsWith(".csv"), "nome del file con l'autore: " + dl.suggestedFilename());
check(csv.charCodeAt(0) === 0xfeff && csv.includes("ID testo;Sezione") && csv.includes("Giulia Bianchi") && csv.includes("Frase più breve"), "CSV per Excel con ID, autore e nota");
check(csv.trim().split("\r\n").length === 3, "CSV con 2 proposte");
await page.waitForTimeout(200);
check((await page.locator(".ed-status").innerText()).includes("Esportate il"), "dopo l'export il promemoria cambia");
check(await page.locator('[data-ed="export"].ed-attn').count() === 0, "pulsante Esporta non più evidenziato");

// uscita dopo l'export: nessun avviso
const prima = dialoghi.length;
await page.reload(); await page.waitForTimeout(500);
check(dialoghi.length === prima, "nessun avviso se tutto è stato esportato");

// svuotamento con conferma
await page.click('[data-ed="export"]');
await page.locator(".ed-more summary").click();
await page.click('[data-ex="svuota"]');
check(nb(await page.locator("#hero-title").innerText()).includes("con Società Dolce"), "il primo clic su «Svuota» chiede conferma");
await page.click('[data-ex="svuota"]');
await page.waitForTimeout(200);
check(nb(await page.locator("#hero-title").innerText()).includes("in Società Dolce"), "dopo la conferma le proposte sono cancellate");
await browser.close();

console.log(ok.map((m) => "✓ " + m).join("\n"));
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`\n${ok.length} controlli superati`);
