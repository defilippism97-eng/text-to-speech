// Casi di test delle regole di matching (titolo dichiarato vs requisiti ruolo/servizio/regione).
// Uso: NODE_PATH=$(npm root -g) node build/test_matching.mjs
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CASI = [
  // [descrizione, titoli, filtro servizio {settore, nome, prov}, ruolo, esito atteso]
  ["ASA in CRA Vicenza (Veneto) → serve riqualifica OSS", ["asa"], { nome: "CRA / RSA", prov: "VI" }, "asa", "near"],
  ["ASA in CRA Vicenza: ruolo OSS raggiungibile", ["asa"], { nome: "CRA / RSA", prov: "VI" }, "oss", "near"],
  ["ASA in RSA Lombardia → ok", ["asa"], { nome: "RSA – Residenza", prov: "MI" }, "asa", "ok"],
  ["OSS in RSA Lombardia → ok anche come ASA", ["oss"], { nome: "RSA – Residenza", prov: "MI" }, "asa", "ok"],
  ["L-19 generica nel nido → manca indirizzo infanzia", ["l19"], { nome: "Nidi", prov: "BO" }, "educatore_nido", "near"],
  ["L-19 infanzia nel nido → ok", ["l19_infanzia"], { nome: "Nidi", prov: "BO" }, "educatore_nido", "ok"],
  ["Licenza media nel nido → ausiliario ok", ["obbligo"], { nome: "Nidi", prov: "BO" }, "ausiliario", "ok"],
  ["Licenza media nel nido → educatore lontano", ["obbligo"], { nome: "Nidi", prov: "BO" }, "educatore_nido", "far"],
  ["Diploma in accoglienza adulti h24 → operatore educativo ok", ["diploma"], { nome: "Accoglienza adulti senza dimora h24", prov: "BO" }, "operatore_educativo", "ok"],
  ["Diploma in accoglienza adulti h24 → educatore raggiungibile", ["diploma"], { nome: "Accoglienza adulti senza dimora h24", prov: "BO" }, "educatore", "near"],
  ["Psicologia triennale in fragilità → educatore ok (equipollente)", ["psi_triennale"], { nome: "Accoglienza adulti senza dimora h24", prov: "BO" }, "educatore", "ok"],
  ["L-19 nel CDD Rovigo (Veneto) → serve EP sanitario", ["l19"], { nome: "CDD", prov: "RO" }, "educatore", "near"],
  ["L-19 nel CDD Lombardia → ok", ["l19"], { nome: "CDD", prov: "MN" }, "educatore", "ok"],
  ["EP sanitario nel CDD Rovigo → ok", ["snt2_ep"], { nome: "CDD", prov: "RO" }, "educatore", "ok"],
  ["Diploma nel Team antitratta minori → formazione 120h", ["diploma"], { nome: "Team antitratta", prov: "BO" }, "operatore_educativo", "near"],
  ["Licenza media nel SAD Bologna → ADB non a standard in ER", ["obbligo"], { nome: "SAD", prov: "BO" }, "adb", "near"],
  ["Infermiere in RSD Mantova → ok", ["snt1"], { nome: "RSD", prov: "MN" }, "infermiere", "ok"],
  ["Psicologia L-24 → psicologo raggiungibile (LM-51)", ["psi_triennale"], { nome: "CSE", prov: "BG" }, "psicologo", "near"],
  ["Studente L-19 nel CSRD Bologna → operatore educativo ok", ["studente_l19"], { nome: "CSRD", prov: "BO" }, "operatore_educativo", "ok"],
  ["Nessun titolo indicato → unknown", [], { nome: "CSRD", prov: "BO" }, "educatore", "unknown"],
];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + path.join(root, "dist/lavora-con-noi.html"));
const res = await page.evaluate((casi) => {
  const L = window.SD_LCN, out = [];
  for (const [desc, titoli, f, ruolo, atteso] of casi) {
    L.state.titoli = titoli; L.state.province = [f.prov]; L.state.ovunque = false;
    const s = window.SD_DATI.base.servizi.find((x) => x.nome.indexOf(f.nome) === 0 && x.province.includes(f.prov) && x.ruoli.some((r) => r.id === ruolo));
    if (!s) { out.push([desc, "SERVIZIO NON TROVATO", atteso]); continue; }
    out.push([desc, L.valuta(ruolo, s).stato, atteso]);
  }
  return out;
}, CASI);
await browser.close();
let ko = 0;
for (const [d, got, exp] of res) { const ok = got === exp; if (!ok) ko++; console.log((ok ? "✓ " : "✗ ") + d + (ok ? "" : `  (atteso ${exp}, ottenuto ${got})`)); }
console.log(`\n${res.length - ko}/${res.length} casi superati`);
process.exit(ko ? 1 : 0);
