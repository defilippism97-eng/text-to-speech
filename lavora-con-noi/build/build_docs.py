#!/usr/bin/env python3
"""Genera docs/progetto.html: UX flow, IA, wireframe desktop/mobile, UI, design system,
logica di matching, specifiche tecniche e report qualità dati.
Legge content/catalogo.json, data/*.json e gli screenshot in docs/img (build/screenshots.mjs).

Uso: python3 build/build_docs.py
"""
import base64
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAT = json.loads((ROOT / "content/catalogo.json").read_text(encoding="utf-8"))
BASE = json.loads((ROOT / "data/base-informativa.json").read_text(encoding="utf-8"))
QUAL = json.loads((ROOT / "data/qualita-dati.json").read_text(encoding="utf-8"))
TITOLI = {t["id"]: t for t in CAT["titoli"]}
RUOLI = {r["id"]: r for r in CAT["ruoli"]}
SETTORI = {s["id"]: s for s in CAT["settori"]}
e = html.escape


def img(name, alt):
    p = ROOT / "docs/img" / name
    if not p.exists():
        return f'<div class="shot-missing">Screenshot mancante: {e(name)} (esegui build/screenshots.mjs)</div>'
    b64 = base64.b64encode(p.read_bytes()).decode()
    return f'<img loading="lazy" src="data:image/jpeg;base64,{b64}" alt="{e(alt)}">'


def fonts():
    out = ""
    for w in (400, 600, 700, 800):
        f = ROOT / f"assets/fonts/barlow-{w}-latin.woff2"
        if f.exists():
            out += f'@font-face{{font-family:"Barlow";font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(f.read_bytes()).decode()}) format("woff2")}}\n'
    return out


# --------------------------------------------------------------------- UX flow (SVG)
def ux_flow():
    N = {
        # id: (x, y, w, h, label, kind)
        "home": (20, 40, 150, 46, "Home sito / menu", "in"),
        "social": (20, 100, 150, 46, "Campagne social · QR", "in"),
        "scuole": (20, 160, 150, 46, "Università · job day", "in"),
        "hero": (215, 100, 150, 58, "Hero\n«Scopri chi puoi diventare»", "page"),
        "s1": (410, 100, 120, 58, "1 · Chi sei oggi?", "step"),
        "s2": (555, 100, 130, 58, "2 · Cosa studi /\nin cosa sei formato/a?", "step"),
        "s3": (710, 100, 125, 58, "3 · In quale ambito?", "step"),
        "s4": (860, 100, 120, 58, "4 · Dove?", "step"),
        "s5": (1010, 100, 170, 58, "5 · Servizi in cui\npotresti lavorare", "out"),
        "s51": (1010, 210, 170, 58, "5.1 · Professionalità\ndel servizio", "out"),
        "s52": (1010, 320, 170, 58, "5.2 · Matching\ntitolo ↔ requisiti", "match"),
        "A": (700, 440, 190, 76, "A · Hai i requisiti\nOfferte aperte (ATS filtrato)\nCandidatura spontanea", "ok"),
        "B": (905, 440, 190, 76, "B · Ti manca qualcosa\nCosa manca · percorsi formativi\nRuolo ponte · orientamento", "near"),
        "C": (1110, 440, 150, 76, "C · Conosci qualcuno?\nSegnalazione", "refer"),
        "ats": (20, 250, 150, 46, "Posizioni aperte (ATS)", "ext"),
        "brand": (215, 330, 150, 120, "Employer branding\nPerché noi · Numeri\nCrescita · Formazione\nStorie video", "page"),
        "cta": (410, 380, 180, 70, "CTA finale\nCandidatura spontanea\nSegnala qualcuno", "page"),
        "crm": (700, 560, 560, 44, "Ufficio Ricerca e Selezione · ATS / CRM candidati · nurturing percorsi formativi", "ext"),
    }
    colors = {"in": ("#F3F7FC", "#6CA2D2"), "page": ("#E4ECF7", "#36549C"), "step": ("#FFFFFF", "#0F5AAB"), "out": ("#FFF8F1", "#F5A54A"),
              "match": ("#13234F", "#13234F"), "ok": ("#E2F3EA", "#2E9A6A"), "near": ("#FFF0DC", "#E08A1E"), "refer": ("#ECE9F8", "#4B3F8F"), "ext": ("#EEF1F6", "#5B6475")}

    def anchor(n, side):
        x, y, w, h = N[n][:4]
        return {"r": (x + w, y + h / 2), "l": (x, y + h / 2), "t": (x + w / 2, y), "b": (x + w / 2, y + h)}[side]

    E = [("home", "r", "hero", "l"), ("social", "r", "hero", "l"), ("scuole", "r", "hero", "l"),
         ("hero", "r", "s1", "l"), ("s1", "r", "s2", "l"), ("s2", "r", "s3", "l"), ("s3", "r", "s4", "l"), ("s4", "r", "s5", "l"),
         ("s5", "b", "s51", "t"), ("s51", "b", "s52", "t"), ("s52", "b", "A", "t"), ("s52", "b", "B", "t"), ("s52", "b", "C", "t"),
         ("hero", "b", "ats", "t"), ("A", "b", "crm", "t"), ("B", "b", "crm", "t"), ("C", "b", "crm", "t"), ("brand", "r", "cta", "l"), ("cta", "b", "crm", "l"),
         ("hero", "b", "brand", "t")]
    svg = ['<svg viewBox="0 0 1280 620" class="flow" role="img" aria-labelledby="flow-t flow-d"><title id="flow-t">UX flow della pagina Lavora con noi</title>'
           '<desc id="flow-d">Dagli ingressi alla hero, i quattro passi di orientamento, i servizi, le professionalità e il matching con tre esiti: candidatura, percorso formativo o segnalazione.</desc>'
           '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5B6475"/></marker></defs>']
    for a, sa, b, sb in E:
        x1, y1 = anchor(a, sa)
        x2, y2 = anchor(b, sb)
        if sa in "lr" and sb in "lr":
            mx = (x1 + x2) / 2
            d = f"M{x1} {y1} H{mx} V{y2} H{x2}"
        elif sa == "b" and sb == "t":
            my = (y1 + y2) / 2
            d = f"M{x1} {y1} V{my} H{x2} V{y2}"
        else:
            d = f"M{x1} {y1} V{y2} H{x2}"
        svg.append(f'<path d="{d}" fill="none" stroke="#5B6475" stroke-width="1.5" marker-end="url(#ar)"/>')
    # salta passo
    svg.append('<path d="M470 158 C 600 205, 820 205, 1010 140" fill="none" stroke="#6CA2D2" stroke-width="1.5" stroke-dasharray="5 5" marker-end="url(#ar)"/>'
               '<text x="740" y="210" class="fl-note">«Salta questa domanda» (passi 2-4): i filtri restano aperti</text>')
    svg.append('<path d="M1180 129 C 1250 129, 1250 30, 1100 30 L 720 30 C 640 30, 620 60, 620 98" fill="none" stroke="#6CA2D2" stroke-width="1.5" stroke-dasharray="5 5" marker-end="url(#ar)"/>'
               '<text x="905" y="22" class="fl-note" text-anchor="middle">Riepilogo risposte cliccabile: torna a qualsiasi passo</text>')
    for k, (x, y, w, h, label, kind) in N.items():
        fill, stroke = colors[kind]
        tc = "#fff" if kind == "match" else "#13234F"
        svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{stroke}" stroke-width="{2 if kind in ("step","match","ok","near","refer") else 1.2}"/>')
        lines = label.split("\n")
        y0 = y + h / 2 - (len(lines) - 1) * 8
        for i, ln in enumerate(lines):
            weight = 700 if i == 0 else 500
            svg.append(f'<text x="{x + w/2}" y="{y0 + i*16 + 4}" text-anchor="middle" fill="{tc}" font-size="{12.5 if i == 0 else 11.5}" font-weight="{weight}">{e(ln)}</text>')
    svg.append("</svg>")
    return "".join(svg)


# --------------------------------------------------------------------- wireframe
WF = {
    "landing": ("Landing · hero + manifesto + numeri", """
<div class="w-head"><i class="w-logo"></i><div class="w-nav"><i></i><i></i><i></i><i></i></div><i class="w-btn sm"></i><i class="w-burger"></i></div>
<div class="w-hero"><div class="w-col"><i class="w-kicker"></i><i class="w-h1"></i><i class="w-h1 s"></i><i class="w-p"></i><i class="w-p s"></i><div class="w-row"><i class="w-btn p"></i><i class="w-btn"></i></div><div class="w-row"><i class="w-stat"></i><i class="w-stat"></i><i class="w-stat"></i></div></div><div class="w-visual"><span>Rete animata<br>persone → tasselli</span></div></div>
<div class="w-sec"><i class="w-h2"></i><div class="w-grid3"><i class="w-card"></i><i class="w-card"></i><i class="w-card"></i></div></div>
<div class="w-band"><i class="w-num"></i><i class="w-num"></i><i class="w-num"></i><i class="w-num"></i><i class="w-num"></i><i class="w-num"></i></div>
""", ["Header sticky: ancore di sezione + CTA «Posizioni aperte» (su mobile: menu a scomparsa)", "H1 + payoff + 2 CTA: «Inizia il percorso» (primaria) e «Vai alle posizioni aperte»", "Visual animato SVG (no video): accessibile e leggero", "Numeri animati calcolati dalla base informativa"]),
    "step12": ("Passi 1-2 · profilo e formazione", """
<div class="w-wiz"><div class="w-prog"><i class="on"></i><i class="cur"></i><i></i><i></i><i></i></div><i class="w-small"></i><i class="w-h3"></i><i class="w-p"></i>
<div class="w-search"><span>Cerca titolo, qualifica o professione…</span></div><div class="w-list"><i></i><i class="hl"></i><i></i></div>
<div class="w-row wrap"><i class="w-chip on"></i><i class="w-chip on"></i></div><i class="w-small"></i><div class="w-row wrap"><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i></div>
<div class="w-navbar"><i class="w-btn"></i><span class="w-skip">Salta</span><i class="w-btn p"></i></div></div>
""", ["Barra di avanzamento a 5 tappe, cliccabile all'indietro", "Combobox con sinonimi (es. «maestra» → LM-85bis) e titoli multipli come chip", "Scelte rapide per i titoli più frequenti", "«Salta» sempre disponibile: nessun vicolo cieco"]),
    "step3": ("Passo 3 · ambiti (card animate)", """
<div class="w-wiz"><div class="w-prog"><i class="on"></i><i class="on"></i><i class="cur"></i><i></i><i></i></div><i class="w-h3"></i><i class="w-p"></i>
<div class="w-grid4"><div class="w-scard"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard on"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard on"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div><div class="w-scard"><i class="w-img"></i><i class="w-t"></i><i class="w-p"></i></div></div>
<div class="w-navbar"><i class="w-btn"></i><i class="w-btn p"></i></div></div>
""", ["7 card: icona + visual + impatto in una frase + n. servizi", "Selezione multipla con stato evidente (bordo + check)", "Ingresso a cascata (60 ms tra card), hover con sollevamento"]),
    "step4": ("Passo 4 · territorio", """
<div class="w-wiz"><div class="w-prog"><i class="on"></i><i class="on"></i><i class="on"></i><i class="cur"></i><i></i></div><i class="w-h3"></i><i class="w-p"></i>
<div class="w-geo"><div class="w-map"><b style="left:15%;top:20%"></b><b style="left:30%;top:35%"></b><b class="on" style="left:62%;top:70%"></b><b style="left:48%;top:60%"></b><b style="left:70%;top:30%"></b><b style="left:85%;top:85%"></b><span>Mappa stilizzata<br>province con n. servizi</span></div><div class="w-col"><i class="w-small"></i><div class="w-row wrap"><i class="w-chip"></i><i class="w-chip on"></i><i class="w-chip"></i></div><i class="w-small"></i><div class="w-row wrap"><i class="w-chip"></i><i class="w-chip on"></i><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i></div><i class="w-opt"></i></div></div>
<div class="w-navbar"><i class="w-btn"></i><i class="w-btn p"></i></div></div>
""", ["Mappa: bottoni-provincia posizionati su coordinate reali, badge con n. servizi per gli ambiti scelti", "Alternativa accessibile: pillole Regioni / Province (44 px)", "«Sono disponibile a spostarmi» azzera il filtro"]),
    "results": ("Passo 5 · servizi in cui potresti lavorare", """
<i class="w-small"></i><i class="w-h2"></i><i class="w-p"></i><div class="w-row wrap"><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i><i class="w-chip"></i></div>
<div class="w-grid3"><div class="w-svc"><i class="w-img"><em class="ok">✓ 2 ruoli per te</em></i><i class="w-t"></i><i class="w-p"></i><div class="w-row"><i class="w-dot ok"></i><i class="w-dot near"></i><i class="w-dot"></i></div><i class="w-btn p sm"></i></div><div class="w-svc"><i class="w-img"><em class="near">↗ Raggiungibile</em></i><i class="w-t"></i><i class="w-p"></i><div class="w-row"><i class="w-dot near"></i><i class="w-dot"></i></div><i class="w-btn p sm"></i></div><div class="w-svc"><i class="w-img"><em class="ok">✓ 1 ruolo per te</em></i><i class="w-t"></i><i class="w-p"></i><div class="w-row"><i class="w-dot ok"></i><i class="w-dot"></i></div><i class="w-btn p sm"></i></div></div>
""", ["Riepilogo risposte come tag cliccabili (modifica rapida)", "Card servizio: contesto prima degli annunci; badge esito sintetico", "Ordinamento per pertinenza: ruoli «ok» diretti → raggiungibili → altri", "Nessun risultato in provincia → fallback regione, con messaggio"]),
    "detail": ("Dettaglio servizio · professionalità e matching", """
<div class="w-dhero"><i class="w-small"></i><i class="w-h2 l"></i><i class="w-p l"></i></div>
<div class="w-grid2"><i class="w-story wide"></i><i class="w-story"></i><i class="w-story"></i><i class="w-story"></i><i class="w-story"></i></div>
<div class="w-role ok"><i class="w-av"></i><div class="w-col"><i class="w-badge ok"></i><i class="w-t"></i><i class="w-p"></i></div></div>
<div class="w-match ok"><span>A · Hai i requisiti → Offerte · Candidatura</span></div>
<div class="w-role near"><i class="w-av"></i><div class="w-col"><i class="w-badge near"></i><i class="w-t"></i><i class="w-p"></i></div></div>
<div class="w-match near"><span>B · Cosa manca · Percorsi · Ruolo ponte</span></div>
<div class="w-match refer"><span>C · Conosci qualcuno? Segnala</span></div>
""", ["Pannello laterale (desktop) / a tutto schermo (mobile) con URL #servizio-id condivisibile", "Racconto: contesto, persone, impatto, ambiente, crescita", "Card ruolo espandibile: sintesi, competenze, percorso, requisiti ufficiali", "Blocco esito A/B/C con CTA dedicate"]),
}


def wireframes(mode):
    out = []
    for k, (title, body, notes) in WF.items():
        out.append(f'<figure class="wf-fig"><div class="wf-frame {mode}"><div class="wf">{body}</div></div>'
                   f'<figcaption><b>{e(title)}</b><ol>{"".join(f"<li>{e(n)}</li>" for n in notes)}</ol></figcaption></figure>')
    return "".join(out)


# --------------------------------------------------------------------- tabelle dati
def ia_tree():
    by = {}
    for s in BASE["servizi"]:
        by.setdefault(s["settore"], []).append(s)
    items = []
    for sid, lst in by.items():
        roles = sorted({r["id"] for s in lst for r in s["ruoli"]}, key=lambda r: -RUOLI[r]["peso"])
        items.append(f'<li><b>{e(SETTORI[sid]["label"])}</b> <span class="muted">· {len(lst)} servizi · {len(roles)} professioni</span>'
                     f'<ul><li>{", ".join(e(s["nome"]) for s in lst[:6])}{"…" if len(lst) > 6 else ""}</li>'
                     f'<li class="muted">Ruoli: {", ".join(e(RUOLI[r]["nome"].split(" – ")[0]) for r in roles)}</li></ul></li>')
    return "".join(items)


def eccezioni_table():
    rows = []
    for x in CAT["eccezioni"]:
        ambito = ", ".join(filter(None, [", ".join(SETTORI[s]["label"] for s in x.get("settori", [])), ", ".join(x.get("sottosettori", [])), ", ".join(x.get("regioni", []))])) or "tutti"
        acc = ", ".join(TITOLI[t]["label"] for t in x.get("accettati", [])) if "accettati" in x else "(invariato)"
        if "accettati" in x and not x["accettati"]:
            acc = "<i>nessuno: ruolo non conteggiabile a standard</i>"
        else:
            acc = e(acc)
        rows.append(f"<tr><td>{e(RUOLI[x['ruolo']]['nome'])}</td><td>{e(ambito)}</td><td>{acc}</td><td class='muted'>{e(x.get('fonte',''))}</td></tr>")
    return "".join(rows)


def titoli_table():
    rows = []
    for t in CAT["titoli"]:
        impl = ", ".join(CAT["implicazioni"].get(t["id"], []))
        rows.append(f"<tr><td><code>{t['id']}</code></td><td>{e(t['label'])}</td><td>{e(t['gruppo'])}</td><td class='muted'>{e(', '.join(t['sinonimi']))}</td><td><code>{e(impl)}</code></td></tr>")
    return "".join(rows)


def tokens():
    sw = [("--brand-900", "#13234F", "Testo su chiaro, footer"), ("--brand-700", "#36549C", "Sezione orientamento (dal sito)"), ("--brand-600", "#0F5AAB", "CTA primaria (dal sito)"),
          ("--brand-500", "#006CB4", "Blu logo · evidenze"), ("--brand-300", "#6CA2D2", "Azzurro logo · decorazioni"), ("--brand-200", "#BACCE4", "Bordi interattivi"),
          ("--brand-50", "#F3F7FC", "Superfici tenui"), ("--warm-50", "#FFF8F1", "Fondo risultati (calore)"), ("--sun-400", "#F5A54A", "Accento caldo (solo grafica/badge)"),
          ("--ok-700 / 100", "#1F6B4A", "Esito A · hai i requisiti"), ("--near-700 / 100", "#8A4B00", "Esito B · ti manca qualcosa"), ("--refer-700 / 100", "#4B3F8F", "Esito C · segnala")]
    return "".join(f'<li><span class="sw" style="background:{c}"></span><code>{n}</code><b>{c}</b><small>{e(u)}</small></li>' for n, c, u in sw)


def quality():
    q = QUAL
    s = q["_sintesi"]
    righe = q.get("_righe_totali", 0)
    items = [
        (f"{s.get('job_description_mancante',0)} righe su {righe}", "Colonna «Ruolo – sintesi Job Description» vuota", "Nel prototipo le sintesi sono bozze in content/catalogo.json (per ruolo, non per servizio). Da sostituire con il lavoro del gruppo «Motivazione e Performance»."),
        (f"{s.get('turno_da_completare',0)} righe", "Turno di lavoro «da completare» o vuoto", "Il prototipo mostra l'orario solo se presente. Il turno aiuta molto nella scelta: completarlo per tutti i servizi."),
        (f"{s.get('territorio_mancante',0)} righe", "Territorio vuoto o «da completare» (RSA, CDI, SFA)", "Assunto «Lombardia – sedi da definire» per coerenza con le mansioni (ASA, ADB). Da confermare con i responsabili di area."),
        (f"{s.get('descrizione_servizio_mancante',0)} servizi", "Descrizione del servizio mancante", "Bozze provvisorie, marcate in pagina come «testo provvisorio»: " + "; ".join(q.get("descrizione_servizio_mancante", []))),
        (f"{s.get('requisiti_con_note_interne',0)} righe", "Requisiti con note di lavoro interne («da verificare con…», «(?)»)", "Rimosse in automatico dal testo pubblico; restano da sciogliere nella matrice."),
        (", ".join(sorted(set(q.get("servizio_regione_da_verificare", [])))) or "—", "Colonne regionali ancora «da verificare» nel foglio Servizio × Regione", "Le regole di matching per Lombardia e Veneto vanno validate prima del go-live."),
        (f"{s.get('righe_scartate',0)} riga", "Riga senza settore/servizio/mansione (es. «Domiciliari»)", "Ignorata in import."),
    ]
    return "".join(f"<tr><td><b>{e(a)}</b></td><td>{e(b)}</td><td>{e(c)}</td></tr>" for a, b, c in items)


def main():
    st = BASE["statistiche"]
    shots = [("01-hero", "Hero"), ("02-step1", "Passo 1"), ("03-step2-ricerca", "Passo 2 · ricerca titolo"), ("04-step3-ambiti", "Passo 3 · ambiti"),
             ("05-step4-mappa", "Passo 4 · mappa"), ("06-risultati", "Passo 5 · servizi"), ("07-servizio", "Dettaglio servizio"), ("08-matching", "Matching A/B/C"), ("09-crescita", "Percorsi di crescita")]
    gallery_d = "".join(f'<figure class="shot">{img("desktop-" + n + ".jpg", "Desktop: " + t)}<figcaption>{e(t)}</figcaption></figure>' for n, t in shots)
    gallery_m = "".join(f'<figure class="shot m">{img("mobile-" + n + ".jpg", "Mobile: " + t)}<figcaption>{e(t)}</figcaption></figure>' for n, t in shots)
    tpl = (ROOT / "build/progetto.template.html").read_text(encoding="utf-8")
    rep = {
        "{{FONTS}}": fonts(),
        "{{FLOW}}": ux_flow(),
        "{{IA}}": ia_tree(),
        "{{WF_DESKTOP}}": wireframes("desktop"),
        "{{WF_MOBILE}}": wireframes("mobile"),
        "{{GALLERY_D}}": gallery_d,
        "{{GALLERY_M}}": gallery_m,
        "{{TOKENS}}": tokens(),
        "{{ECCEZIONI}}": eccezioni_table(),
        "{{TITOLI}}": titoli_table(),
        "{{QUALITA}}": quality(),
        "{{N_SERVIZI}}": str(st["servizi"]), "{{N_TIPI}}": str(st["tipologieServizio"]), "{{N_PROF}}": str(st["professioni"]),
        "{{N_PROV}}": str(st["province"]), "{{N_REG}}": str(st["regioni"]), "{{N_TITOLI}}": str(len(CAT["titoli"])), "{{N_ECC}}": str(len(CAT["eccezioni"])),
        "{{N_RIGHE}}": str(QUAL.get("_righe_totali", "")), "{{VERSIONE}}": e(BASE["versione"]),
    }
    for k, v in rep.items():
        tpl = tpl.replace(k, v)
    (ROOT / "docs/progetto.html").write_text(tpl, encoding="utf-8")
    print("docs/progetto.html", round(len(tpl) / 1024), "KB")


if __name__ == "__main__":
    main()
