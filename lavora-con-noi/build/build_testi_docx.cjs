// Genera docs/testi-lavora-con-noi.docx: tutti i testi del sito, divisi in testi generali e
// settore → territorio → servizio → mansione, con indice cliccabile.
// Prima eseguire build/estrai_testi.mjs (testi generali dalla pagina).
// Uso: node build/build_testi_docx.cjs
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Bookmark, InternalHyperlink,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat, PageBreak,
  Footer, Header, PageNumber, TabStopType, TabStopPosition,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const CAT = read("content/catalogo.json");
const BASE = read("data/base-informativa.json");
const GEN = read("data/testi-generali.json");
const RUOLI = Object.fromEntries(CAT.ruoli.map((r) => [r.id, r]));
const TITOLI = Object.fromEntries(CAT.titoli.map((t) => [t.id, t]));
const SETTORI = CAT.settori;

// ---------------------------------------------------------------- stile
const BLU = "0F5AAB", BLU_SCURO = "13234F", GRIGIO = "5B6475", AMBRA = "8A4B00";
const FONT = "Arial";
const W = 9638; // larghezza utile A4 con margini 2 cm (DXA)

let bm = 0;
const indice = []; // {livello, testo, anchor}
function anchorId(prefix) { bm += 1; return `${prefix}_${bm}`; }

function h(level, text, opts = {}) {
  const anchor = anchorId("s");
  if (opts.toc !== false) indice.push({ livello: level, testo: text, anchor });
  const lv = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][level];
  return new Paragraph({ heading: lv, pageBreakBefore: !!opts.pageBreak, children: [new Bookmark({ id: anchor, children: [new TextRun(text)] })] });
}
function p(text, o = {}) {
  return new Paragraph({ spacing: { after: o.after ?? 100 }, children: [new TextRun({ text, bold: o.bold, italics: o.italics, color: o.color, size: o.size })] });
}
function label(lab, text, o = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: lab + ": ", bold: true, color: BLU_SCURO }), new TextRun({ text, italics: o.italics, color: o.color })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({ numbering: { reference: "punti", level }, spacing: { after: 40 }, children: [new TextRun(text)] });
}
function flag(text) {
  return new Paragraph({
    spacing: { after: 100 },
    shading: { type: ShadingType.CLEAR, fill: "FFF0DC" },
    children: [new TextRun({ text: "DA VALIDARE · ", bold: true, color: AMBRA }), new TextRun({ text, color: AMBRA })],
  });
}
function nota(text) { return p(text, { italics: true, color: GRIGIO, size: 19 }); }

// tabella a due colonne: elemento | testo
function tabella(righe, larg = [2600, W - 2600]) {
  const bordo = { style: BorderStyle.SINGLE, size: 4, color: "D6DEEB" };
  const borders = { top: bordo, bottom: bordo, left: bordo, right: bordo };
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: larg,
    rows: righe.map(([a, b], i) => new TableRow({
      children: [
        new TableCell({ width: { size: larg[0], type: WidthType.DXA }, borders, shading: { type: ShadingType.CLEAR, fill: "F3F7FC" }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: a, bold: true, color: BLU_SCURO, size: 19 })] })] }),
        new TableCell({ width: { size: larg[1], type: WidthType.DXA }, borders, margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: String(b).split("\n").map((t) => new Paragraph({ children: [new TextRun({ text: t, size: 20 })] })) }),
      ],
    })),
  });
}
function spazio() { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

// ---------------------------------------------------------------- logica dei requisiti (come in src/app.js)
function requisiti(ruoloId, s) {
  const r = RUOLI[ruoloId];
  const out = { accettati: r.accettati, vicini: r.vicini || [], nota: r.nota || "", fonte: "" };
  let best = null, bestScore = -1;
  for (const e of CAT.eccezioni) {
    if (e.ruolo !== ruoloId) continue;
    let score = 0;
    if (e.settori) { if (!e.settori.includes(s.settore)) continue; score++; }
    if (e.sottosettori) { if (!e.sottosettori.includes(s.sottosettore)) continue; score++; }
    if (e.regioni) { if (!s.regioni.every((x) => e.regioni.includes(x))) continue; score++; }
    if (score > bestScore) { best = e; bestScore = score; }
  }
  if (best) {
    if (best.accettati) out.accettati = best.accettati;
    if (best.vicini) out.vicini = best.vicini;
    if (best.nota) out.nota = best.nota;
    out.fonte = best.fonte || "";
  }
  return out;
}
const titolo = (id) => (TITOLI[id] ? TITOLI[id].label : id);
function ambiente(s) {
  const tipo = /resid|h24|comunit/i.test(s.nome + s.nomeOriginale) ? "Servizio residenziale, aperto tutto l'anno" : (/diurn|centro/i.test(s.nome) ? "Servizio diurno" : "Servizio territoriale");
  return [s.orario, tipo].filter(Boolean).join(" · ") + ". Lavori in un'équipe multiprofessionale con coordinamento dedicato.";
}

// ---------------------------------------------------------------- contenuto
const body = [];

// 1 · Testi generali
body.push(h(1, "1. Testi generali della pagina", { pageBreak: true }));
body.push(nota("Testi estratti dalla pagina così come appaiono, nell'ordine in cui si incontrano scorrendo."));

function blocco(titoloSez, righe, extra) {
  body.push(h(2, titoloSez));
  for (const r of righe) body.push(bullet(r));
  if (extra) extra.forEach((x) => body.push(x));
}
blocco("1.1 Banner del prototipo e menu", [...GEN.banner, "Menu: " + GEN.menu.join(" · "), "Pulsante in alto: " + GEN.headerCta.join(" ")]);
blocco("1.2 Apertura (hero)", GEN.hero, [label("Testo alternativo della foto", GEN.heroAlt)]);
blocco("1.3 Perché lavorare con noi", GEN.perche);
const iFonte = GEN.numeri.findIndex((t) => t.startsWith("Fonte:"));
const ticker = [...new Set(GEN.numeri.slice(iFonte + 1))];
blocco("1.4 Società Dolce in numeri", GEN.numeri.slice(0, iFonte + 1), [label("Fascia scorrevole (settori e professioni)", ticker.join(" · "))]);

body.push(h(2, "1.5 Orientamento: i passi del percorso"));
GEN.orientamentoIntro.forEach((t) => body.push(bullet(t)));
const passi = [["Passo 1 · Chi sei oggi?", GEN.passi.passo1], ["Passo 2 · Formazione", GEN.passi.passo2], ["Passo 3 · Ambito", GEN.passi.passo3], ["Passo 4 · Territorio", GEN.passi.passo4], ["Passo 5 · Risultati", [...GEN.passi.passo5, ...GEN.passi.risultatiIntro]]];
for (const [t, righe] of passi) {
  body.push(h(3, t, { toc: false }));
  righe.forEach((r) => body.push(bullet(r)));
}
body.push(nota("Nel passo 2 l'elenco completo dei titoli selezionabili è nel capitolo 5. Nel passo 3 i testi delle card dei settori sono nel capitolo 2."));

body.push(h(2, "1.6 Percorsi di crescita"));
GEN.crescitaIntro.forEach((t) => body.push(bullet(t)));
for (const [k, pc] of Object.entries(CAT.percorsiCrescita)) {
  body.push(label(pc.label, pc.tappe.join(" → ")));
  body.push(nota(pc.note));
}
blocco("1.7 Formazione e catalogo formativo", GEN.formazione);
blocco("1.8 Storie", GEN.storie, [flag("Incipit e ruoli delle testimonianze sono esempi: vanno sostituiti con le frasi reali dei video.")]);
blocco("1.9 Invito finale e piè di pagina", [...GEN.ctaFinale, ...GEN.footer]);

body.push(h(2, "1.10 Finestre e moduli"));
const nomiModali = { candidaturaSpontanea: "Candidatura spontanea", segnalazione: "Segnalazione", offerte: "Offerte aperte" };
for (const [k, righe] of Object.entries(GEN.modali)) {
  body.push(h(3, nomiModali[k] || k, { toc: false }));
  righe.forEach((r) => body.push(bullet(r)));
}
body.push(tabella([
  ["Richiesta di orientamento", "Titolo: Parliamo del tuo percorso\nTesto: Ti ricontattiamo per orientarti sui percorsi formativi e sui ruoli ponte con cui puoi iniziare a lavorare con noi."],
  ["Errori dei campi", "Campo obbligatorio · Campo obbligatorio (inserisci un'email valida) · Serve il consenso per procedere. · Serve la conferma per procedere."],
  ["Conferma di invio", "Grazie!\nAbbiamo ricevuto la tua richiesta. Ti risponderemo entro 10 giorni lavorativi.\nAbbiamo ricevuto la tua segnalazione. Ti terremo aggiornato/a.\nPrototipo: nessun dato è stato inviato o salvato."],
]));

body.push(h(2, "1.11 Messaggi del confronto tra titolo e requisiti"));
body.push(nota("Compaiono nelle card dei ruoli dentro la scheda di ogni servizio. Le parti tra parentesi quadre cambiano in base al ruolo e al servizio."));
body.push(tabella([
  ["Etichette di stato", "Hai i requisiti · Ti manca qualche requisito · Requisiti diversi dal tuo profilo · Indica il tuo titolo per verificare · Non previsto in questa regione"],
  ["Badge delle card servizio", "[N] ruolo/i per te · Raggiungibile con un percorso · Scopri i requisiti"],
  ["A · Hai già i requisiti", "Il tuo profilo è coerente con questo ruolo (grazie al tuo titolo di studio). Puoi candidarti subito.\nPulsanti: Vedi le offerte aperte · Candidatura spontanea"],
  ["B · Ti manca qualche requisito", "Ti manca qualche requisito: ecco come arrivarci\nCosa manca: [testo del ruolo, vedi le schede dei servizi].\n[Percorsi formativi suggeriti]\nIntanto puoi iniziare come [ruolo ponte]: hai già i requisiti e lavori nello stesso servizio mentre ti formi.\nPulsanti: Voglio saperne di più · Offerte come [ruolo ponte]"],
  ["Requisiti diversi", "Per questo ruolo serve [elenco titoli].\nPulsante: Chiedi un orientamento"],
  ["Titolo non indicato", "Dicci cosa hai studiato e ti diciamo subito se puoi candidarti.\nPulsante: Indica il tuo titolo"],
  ["Ruolo non previsto", "In questa regione il ruolo non è conteggiato negli standard del servizio."],
  ["C · Segnalazione", "Conosci qualcuno adatto a questo ruolo? · Segnala una persona"],
  ["Riepilogo dei risultati", "In [N] di questi c'è già almeno un ruolo per cui hai i requisiti. Negli altri ti mostriamo come arrivarci.\nPer ora non risulti avere tutti i requisiti per questi ruoli, ma per molti esiste una strada: aprili per scoprire cosa ti manca e come ottenerlo.\nNon hai indicato un titolo di studio: apri un servizio per scoprire le professioni e i requisiti, oppure torna al passo 2."],
  ["Nessun servizio vicino", "Nelle province scelte non abbiamo ancora servizi di questo tipo: ti mostriamo quelli più vicini, nella stessa regione.\nNei territori scelti non abbiamo ancora servizi di questo tipo: ti mostriamo tutte le opportunità del settore."],
]));

// 2 · Settori
body.push(h(1, "2. Settori", { pageBreak: true }));
body.push(nota("Testi delle card del passo 3 e della scheda servizio («Le persone che incontri», «L'impatto che generi»). Dati numerici dalla brochure istituzionale 2025."));
for (const s of SETTORI) {
  body.push(h(2, s.label));
  body.push(tabella([
    ["Motto", s.motto],
    ["Impatto (card)", s.impatto],
    ["Persone che incontri", s.persone + "."],
    ["Dato in evidenza", s.dato],
    ["Nota storica", s.storia],
  ]));
  if (s.id === "salute_mentale") body.push(flag("La brochure non riporta un dato specifico per la salute mentale: al posto del numero c'è una frase descrittiva."));
  body.push(spazio());
}

// 3 · Servizi per settore, territorio, mansione
body.push(h(1, "3. Servizi: settore, territorio, servizio e mansione", { pageBreak: true }));
body.push(nota("Per ogni servizio: i testi della scheda e, per ogni mansione, i testi della card ruolo con i requisiti. «Requisiti ufficiali» è il testo della matrice mostrato ai candidati (senza note interne). I titoli accettati e i requisiti mancanti derivano dalle regole del catalogo, comprese le eccezioni regionali."));
const ordineReg = ["Emilia-Romagna", "Lombardia", "Veneto"];
SETTORI.forEach((set, si) => {
  const servizi = BASE.servizi.filter((s) => s.settore === set.id);
  if (!servizi.length) return;
  body.push(h(1, `3.${si + 1} ${set.label}`, { pageBreak: true }));
  const perReg = {};
  servizi.forEach((s) => { const k = s.regioni.join(" e "); (perReg[k] = perReg[k] || []).push(s); });
  const chiavi = Object.keys(perReg).sort((a, b) => ordineReg.indexOf(a.split(" e ")[0]) - ordineReg.indexOf(b.split(" e ")[0]));
  for (const reg of chiavi) {
    body.push(h(2, `${set.label} · ${reg}`));
    for (const s of perReg[reg].sort((a, b) => a.nome.localeCompare(b.nome))) {
      body.push(h(3, `${s.nome} — ${s.localita}`));
      const ruoli = s.ruoli.map((r) => ({ r, m: RUOLI[r.id] })).sort((a, b) => b.m.peso - a.m.peso);
      const area = CAT.percorsiCrescita[ruoli[0].m.area];
      body.push(tabella([
        ["Settore", set.label + (s.sottosettore ? " · " + s.sottosettore : "")],
        ["Territorio", s.localita + " (" + s.province.join(", ") + " · " + s.regioni.join(", ") + ")"],
        ["Nome nella matrice", s.nomeOriginale],
        ["Il contesto", s.descrizione],
        ["Le persone che incontri", set.persone + ". " + set.dato + " in tutta la cooperativa."],
        ["L'impatto che generi", set.impatto],
        ["L'ambiente di lavoro", ambiente(s)],
        ["Dove puoi crescere", area.tappe.join(" → ")],
        ["Mansioni", ruoli.map((x) => x.m.nome).join(" · ")],
      ]));
      if (s.descrizioneProvvisoria) body.push(flag("Descrizione del servizio scritta come bozza: manca nella matrice."));
      for (const { r, m } of ruoli) {
        body.push(h(4, m.nome, { toc: false }));
        const req = requisiti(m.id, s);
        const righe = [
          ["Area e percorso", CAT.percorsiCrescita[m.area].label + ": " + CAT.percorsiCrescita[m.area].tappe.join(" → ")],
          ["Sintesi del ruolo", m.sintesi],
          ["Competenze", m.competenze.join(" · ")],
        ];
        if (r.turni.length) righe.push(["Turni", r.turni.join("\n")]);
        if (r.consulenza) righe.push(["Forma", "Spesso in consulenza"]);
        righe.push(["Requisiti ufficiali (matrice)", r.requisitiMatrice.length ? r.requisitiMatrice.join("\n") : "Da completare nella base informativa."]);
        righe.push(["Titoli accettati (regole)", req.accettati.length ? req.accettati.map(titolo).join("\n") : "Nessuno: ruolo non conteggiabile a standard in questa regione."]);
        if (req.vicini.length) righe.push(["Se manca un requisito", req.vicini.map((v) => `Con ${v.da.map(titolo).join(" / ")} → manca: ${v.manca}. Percorsi: ${v.percorsi.map((pid) => CAT.percorsiFormativi[pid].titolo).join(", ")}${v.ponte ? ". Ruolo ponte: " + RUOLI[v.ponte].nome : ""}.`).join("\n")]);
        if (req.nota) righe.push(["Nota mostrata", req.nota]);
        if (req.fonte) righe.push(["Regola applicata", req.fonte]);
        body.push(tabella(righe));
        if (!r.turni.length && !r.consulenza) body.push(nota("Turno non indicato nella matrice."));
      }
      body.push(spazio());
    }
  }
});

// 4 · Schede ruolo comuni
body.push(h(1, "4. Schede ruolo (testi comuni a tutti i servizi)", { pageBreak: true }));
body.push(flag("Le sintesi dei ruoli sono bozze: la colonna «Ruolo – sintesi Job Description» della matrice è vuota. Vanno sostituite con il lavoro del gruppo Motivazione e Performance."));
for (const r of [...CAT.ruoli].sort((a, b) => a.nome.localeCompare(b.nome))) {
  body.push(h(2, r.nome));
  const righe = [
    ["Area", CAT.percorsiCrescita[r.area].label],
    ["Sintesi", r.sintesi],
    ["Competenze", r.competenze.join(" · ")],
    ["Titoli accettati (regola base)", r.accettati.map(titolo).join("\n")],
  ];
  if ((r.vicini || []).length) righe.push(["Se manca un requisito", r.vicini.map((v) => `Con ${v.da.map(titolo).join(" / ")} → ${v.manca}`).join("\n")]);
  if (r.nota) righe.push(["Nota", r.nota]);
  body.push(tabella(righe));
}

// 5 · Titoli, percorsi formativi, profili
body.push(h(1, "5. Titoli, percorsi formativi e profili", { pageBreak: true }));
body.push(h(2, "5.1 Titoli selezionabili al passo 2"));
const gruppi = [...new Set(CAT.titoli.map((t) => t.gruppo))];
for (const g of gruppi) {
  body.push(h(3, g, { toc: false }));
  CAT.titoli.filter((t) => t.gruppo === g).forEach((t) => body.push(bullet(`${t.label} — si trova anche cercando: ${t.sinonimi.join(", ")}`)));
}
body.push(h(2, "5.2 Percorsi formativi suggeriti quando manca un requisito"));
body.push(tabella(Object.values(CAT.percorsiFormativi).map((pf) => [pf.titolo, pf.durata + "\n" + pf.testo])));
body.push(h(2, "5.3 Profili del passo 1"));
CAT.profili.forEach((pr) => body.push(bullet(`${pr.label} — ${pr.hint}`)));

// 6 · Da validare
body.push(h(1, "6. Riepilogo dei testi da validare", { pageBreak: true }));
const prov = BASE.servizi.filter((s) => s.descrizioneProvvisoria).map((s) => `${s.nome} — ${s.localita}`);
[
  "Sintesi di tutti i ruoli (capitolo 4): bozze, la matrice non ha la colonna compilata.",
  "Descrizioni dei servizi scritte come bozza: " + prov.join("; ") + ".",
  "Servizi senza territorio nella matrice (RSA, CDI, SFA): attribuiti a «Lombardia – sedi da definire».",
  "Regole per Lombardia e Veneto: nella matrice sono ancora «da verificare».",
  "Turni mancanti: indicati nel capitolo 3 con «Turno non indicato nella matrice».",
  "Storie: incipit e ruoli di esempio, da sostituire con le testimonianze reali.",
  "Salute mentale: nessun dato numerico in brochure.",
].forEach((t) => body.push(bullet(t)));

// ---------------------------------------------------------------- copertina e indice
const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
const cover = [
  new Paragraph({ spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "SOCIETÀ DOLCE · LAVORA CON NOI", bold: true, color: BLU, size: 22 })] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Testi del sito", bold: true, size: 64, color: BLU_SCURO })] }),
  new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: "Tutte le diciture della pagina, divise per sezione, settore, territorio, servizio e mansione, per la verifica da parte dei responsabili dei servizi.", size: 26, color: GRIGIO })] }),
  tabella([
    ["Versione", "Prototipo del " + oggi],
    ["Fonti", "Matrice titoli – regione – servizi (" + BASE.versione + "); brochure istituzionale 2025; catalogo formativo 2026/2027; contenuti editoriali del prototipo"],
    ["Contenuto", `${BASE.servizi.length} schede servizio · ${SETTORI.length} settori · ${CAT.ruoli.length} mansioni`],
  ]),
  spazio(),
  new Paragraph({ spacing: { before: 300, after: 100 }, children: [new TextRun({ text: "Come usare questo documento", bold: true, color: BLU_SCURO, size: 24 })] }),
  bullet("Cerca il tuo servizio nell'indice: ogni voce è cliccabile e porta alla scheda."),
  bullet("Per ogni servizio trovi i testi della scheda e, per ogni mansione, i testi della card ruolo e i requisiti mostrati ai candidati."),
  bullet("I riquadri arancioni «DA VALIDARE» segnalano bozze o dati mancanti nella matrice."),
  bullet("Le correzioni vanno riportate nella matrice (testi dei servizi e requisiti) o nel catalogo editoriale (testi generali, ruoli, settori)."),
];
const indiceParas = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Indice")] }),
  ...indice.filter((i) => i.livello <= 3).map((i) => new Paragraph({
    spacing: { after: i.livello === 1 ? 80 : 30, before: i.livello === 1 ? 160 : 0 },
    indent: { left: (i.livello - 1) * 360 },
    children: [new InternalHyperlink({ anchor: i.anchor, children: [new TextRun({ text: i.testo, bold: i.livello === 1, color: i.livello === 1 ? BLU_SCURO : BLU, size: i.livello === 3 ? 19 : 21 })] })],
  })),
];

const doc = new Document({
  creator: "Società Dolce · prototipo Lavora con noi",
  title: "Lavora con noi – Testi del sito",
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: FONT, color: BLU_SCURO }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 27, bold: true, font: FONT, color: BLU }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: FONT, color: BLU_SCURO }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 21, bold: true, font: FONT, color: BLU }, paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 3 } },
    ],
  },
  numbering: { config: [{ reference: "punti", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }, { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 240 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Lavora con noi · Testi del sito", color: GRIGIO, size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], color: GRIGIO, size: 16 })] })] }) },
    children: [...cover, ...indiceParas, ...body],
  }],
});

const dest = path.join(ROOT, "docs/testi-lavora-con-noi.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(dest, buf);
  // docx-js assegna lo stesso w:id a tutti i segnalibri: li rinumero (start/end in coppia, in ordine)
  require("child_process").execFileSync("python3", ["-c", `
import zipfile, re, shutil, sys
src = sys.argv[1]; tmp = src + ".tmp"
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/document.xml":
            xml = data.decode("utf-8"); n = [0]
            def start(m):
                n[0] += 1
                return re.sub(r'w:id="[^"]*"', 'w:id="%d"' % n[0], m.group(0))
            xml = re.sub(r"<w:bookmarkStart [^>]*>", start, xml)
            k = [0]
            def end(m):
                k[0] += 1
                return re.sub(r'w:id="[^"]*"', 'w:id="%d"' % k[0], m.group(0))
            xml = re.sub(r"<w:bookmarkEnd [^>]*>", end, xml)
            data = xml.encode("utf-8")
        zout.writestr(item, data)
shutil.move(tmp, src)
`, dest]);
  console.log(dest, Math.round(fs.statSync(dest).size / 1024) + " KB", "voci indice:", indice.length);
});
