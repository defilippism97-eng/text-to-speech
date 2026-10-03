#!/usr/bin/env python3
"""Converte la matrice Excel "Matrice titoli - regione - servizi" nella base
informativa JSON usata dalla pagina "Lavora con noi" e impacchetta il prototipo.

Uso:
    python3 build/build_data.py <percorso-matrice.xlsx>

Output:
    data/base-informativa.json     servizi, territori, ruoli per servizio, statistiche
    data/qualita-dati.json         campi mancanti / da verificare nella matrice
    dist/lavora-con-noi.html       prototipo autocontenuto (CSS, JS, dati e logo inline)

Requisiti: openpyxl (pip install openpyxl).
"""
import base64
import json
import re
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SHEET_BASE = "Base informativa Lavora con Noi"

# --- Normalizzazioni -------------------------------------------------------

PROVINCE = {
    # sigla: (nome, regione, lon, lat)
    "BO": ("Bologna", "Emilia-Romagna", 11.34, 44.49),
    "MO": ("Modena", "Emilia-Romagna", 10.93, 44.55),
    "PR": ("Parma", "Emilia-Romagna", 10.33, 44.80),
    "FE": ("Ferrara", "Emilia-Romagna", 11.62, 44.84),
    "RN": ("Rimini", "Emilia-Romagna", 12.57, 44.06),
    "MI": ("Milano", "Lombardia", 9.19, 45.46),
    "BG": ("Bergamo", "Lombardia", 9.67, 45.70),
    "BS": ("Brescia", "Lombardia", 10.21, 45.54),
    "CR": ("Cremona", "Lombardia", 10.02, 45.13),
    "MN": ("Mantova", "Lombardia", 10.79, 45.16),
    "VA": ("Varese", "Lombardia", 8.83, 45.82),
    "CO": ("Como", "Lombardia", 9.09, 45.81),
    "VI": ("Vicenza", "Veneto", 11.55, 45.55),
    "RO": ("Rovigo", "Veneto", 11.79, 45.07),
}

# territorio grezzo -> (sigle provincia, località leggibili)
TERRITORI = {
    "Bologna-Casalecchio di Reno-Zola Predosa-Monte San Pietro-Valsamoggia-Vignola (MO)":
        (["BO", "MO"], "Bologna, Casalecchio di Reno, Zola Predosa, Monte San Pietro, Valsamoggia, Vignola"),
    "Bologna": (["BO"], "Bologna"),
    "Bologna e Provincia": (["BO"], "Bologna e provincia"),
    "Bologna città metropolina": (["BO"], "Città metropolitana di Bologna"),
    "Bologna e Budrio (BO)": (["BO"], "Bologna, Budrio"),
    "Bologna - Parma": (["BO", "PR"], "Bologna, Parma"),
    "Bologna - carcere": (["BO"], "Bologna (Casa circondariale)"),
    "Provincia bologna (Reno / Lavino / Samoggia)": (["BO"], "Distretto Reno, Lavino e Samoggia (BO)"),
    "Parma": (["PR"], "Parma"),
    "Sede operativa: Bologna, Ferrara e Parma (aree di competenza anche Rimini e Riccione)":
        (["BO", "FE", "PR", "RN"], "Bologna, Ferrara, Parma (anche Rimini e Riccione)"),
    "Unione Terre di Castelli: Comuni di Castelnuovo, Castelvetro, Guiglia, Marano, Savignano, Spilamberto, Vignola, Zocca (MO)-Pavullo nel Frignano-Polinago (MO)":
        (["MO"], "Unione Terre di Castelli, Pavullo nel Frignano, Polinago (MO)"),
    "Brescia - Mantova - Cremona - Bergamo - Varese - Milano | Anche provincie":
        (["BS", "MN", "CR", "BG", "VA", "MI"], "Brescia, Mantova, Cremona, Bergamo, Varese, Milano e province"),
    "BG (Sovere)": (["BG"], "Sovere (BG)"),
    "MN (San Giorgio Bigarello)": (["MN"], "San Giorgio Bigarello (MN)"),
    "CR (Cremona)\nMI (Sesto San Giovanni - Canegrate)": (["CR", "MI"], "Cremona, Sesto San Giovanni, Canegrate"),
    "Vicenza (VI)": (["VI"], "Vicenza"),
    "Rovigo": (["RO"], "Rovigo"),
}
# Righe senza territorio: le mansioni (ASA, ADB, massofisioterapista) indicano la Lombardia.
TERRITORIO_MANCANTE = (["MI", "BG", "BS", "CR", "MN", "VA"], "Lombardia – sedi da definire")

SETTORI = {
    "Infanzia": ("infanzia", None),
    "Scuola": ("scuola", None),
    "Disabilità": ("disabilita", None),
    "disabilità": ("disabilita", None),
    "Anziani strutture - residenziali": ("anziani", "Residenziale"),
    "Anziani strutture - non residenziali": ("anziani", "Diurno"),
    "Anziani domiciliare": ("domiciliarita", "Assistenza domiciliare"),
    "Trasporti": ("domiciliarita", "Trasporti"),
    "Salute mentale": ("salute_mentale", None),
}

SERVIZI_NOME = {
    "Servizi infanzia 0-6": "Nidi e servizi 0-6",
    "Servizi infanzia 3-6": "Scuole dell'infanzia 3-6",
    "Servizi scolastici 6-18": "Inclusione scolastica 6-18",
    "Servizi scolastici 3-18": "Inclusione scolastica e servizi integrativi 3-18",
    "RSA": "RSA – Residenza sanitaria assistenziale",
    "RSA / CRA": "CRA / RSA – Strutture residenziali per anziani",
    "CDI - Centro diurno Integreto": "CDI – Centro diurno integrato",
    "Centri diurni": "Centri diurni per anziani",
    "SAD": "SAD – Assistenza domiciliare",
    "Supporta trasversalmente altri settori (anziani domiciliare/ disabilità)": "Trasporto e accompagnamento",
    "CSRD - Centro socio riabilitativo diurno": "CSRD – Centro socio-riabilitativo diurno",
    "CSRR - Centro socio riabilitativo residenziale": "CSRR – Centro socio-riabilitativo residenziale",
    "CDD - Centro diurno disabili": "CDD – Centro diurno disabili",
    "RSD - Residenza sanitaria assistenziale disabili": "RSD – Residenza sanitaria disabili",
    "CSS - Comunità socio sanitarie": "CSS – Comunità socio-sanitarie",
    "SFA- Servizio di formazione all'autonomia": "SFA – Servizio di formazione all'autonomia",
    "CSE- Centro socioeducativo": "CSE – Centro socio-educativo",
    "Spazio Rondine": "Spazio Rondine",
    "Sed": "SED – Servizio educativo domiciliare",
    "Comunità minori": "Comunità educative per minori",
    "Centro educativo diurno ---->Servizi Extrascolastici (ex centri socio educativi)  termine corretto": "Servizi extrascolastici",
    "Residenziale SAI (sistema asilo e integrazione - accoglienza migranti) - Minori - Progetto MSNA": "Accoglienza SAI – Minori stranieri non accompagnati",
    "Residenziale SAI (sistema asilo e integrazione - accoglienza migranti) - Adulti e nuclei -Progetto SAI ordinari e vulnerabili": "Accoglienza SAI – Adulti e nuclei familiari",
    "FAMI Rethink": "FAMI Rethink",
    "Sportello accesso protezione internazionale": "Sportello protezione internazionale",
    "Accoglienza adulti senza dimora - h24": "Accoglienza adulti senza dimora h24",
    "Pronta Accoglienza adulti senza dimora - h14": "Pronta accoglienza adulti senza dimora h14",
    "Unità di strada - Sulla Soglia": "Unità di strada \"Sulla Soglia\"",
    "PriNS - Sulla Soglia": "PRiNS \"Sulla Soglia\"",
    "Unità di strada - Sex worker": "Unità di strada \"Oltre la Strada\"",
    "Team antitratta minori": "Team antitratta minori",
    "Progetto europeo Interact": "Progetto europeo Interact",
    "Pronta accoglienza nuclei familiari \"San Sisto\"": "Pronta accoglienza famiglie \"San Sisto\"",
    "Transizione abitativa in alloggi diffusi complessi condominiali": "Transizione abitativa",
    "Abitare Comunità Sinta e progetto RSC (Rom, Sinti e Camminanti)": "Abitare – Comunità Rom, Sinti e Caminanti",
    "Laboratori di Comunità": "Laboratori di comunità",
    "Mediazione interculturale e interventi educativi in contesto carcerario": "Territori per il Reinserimento (carcere)",
    "Pronto intervento sociale (PRIS)": "PRIS – Pronto intervento sociale",
    "Sportelli scociali": "Sportelli sociali",
}

# Descrizioni mancanti nella matrice: bozze da validare (marcate provvisorie).
DESCRIZIONI_PROVVISORIE = {
    "Servizi infanzia 0-6": "Nidi, micronidi e sezioni primavera dove bambine e bambini da 0 a 3 anni crescono tra gioco, cura e relazioni, in un'équipe con coordinamento pedagogico.",
    "Servizi infanzia 3-6": "Scuole dell'infanzia paritarie in cui progettare esperienze di apprendimento, autonomia e socialità per bambine e bambini dai 3 ai 6 anni.",
    "Servizi scolastici 6-18": "Educatori e educatrici nelle scuole di ogni ordine e grado per l'inclusione di alunne e alunni con disabilità, accanto a docenti e famiglie.",
    "RSA": "Residenze per persone anziane non autosufficienti, aperte 24 ore su 24, dove sanitario, assistenziale ed educativo lavorano insieme alla qualità della vita.",
    "CDI - Centro diurno Integreto": "Centri diurni integrati per persone anziane: assistenza, riabilitazione e animazione durante il giorno, per sostenere la vita a casa propria.",
}

RUOLI = {
    # mansione grezza -> id ruoli del catalogo
    "Educatore di nido": ["educatore_nido"],
    "Insegnante": ["insegnante"],
    "Educatore con titolo": ["insegnante"],
    "Ausiliario": ["ausiliario"],
    "Ausiliario - INTESO COME ADDETTO ALLE PULIZIE": ["ausiliario"],
    "Educatori": ["educatore"],
    "Educatore": ["educatore"],
    "Educatori senza titolo": ["operatore_educativo"],
    "Educatori senza titolo (no assistenti sociali)": ["operatore_educativo"],
    "Educatori - Educatori senza titolo": ["educatore", "operatore_educativo"],
    "Educatori e assistenti sociali (solo Parma)": ["educatore", "assistente_sociale"],
    "Educatore e assistente sociale": ["educatore", "assistente_sociale"],
    "OSS": ["oss"],
    "Oss (da verificare)": ["oss"],
    "OSS-ASA": ["oss", "asa"],
    "OSS -ASA": ["oss", "asa"],
    "Oss - ASA": ["oss", "asa"],
    "Oss -ADB": ["oss", "adb"],
    "ASA": ["asa"],
    "ADB": ["adb"],
    "Infermieri": ["infermiere"],
    "Infermieri -": ["infermiere"],
    "Infermeri": ["infermiere"],
    "Fisioterapista": ["fisioterapista"],
    "Massoterapista": ["massoterapista"],
    "Logopedista": ["logopedista"],
    "Psicologo": ["psicologo"],
    "Assistente Sociale": ["assistente_sociale"],
    "Assistenti sociali": ["assistente_sociale"],
    "Fisiatra": ["fisiatra"],
    "Psichiatra": ["psichiatra"],
    "Psicihiatra": ["psichiatra"],
    "Animatore": ["animatore"],
    "Arteterapeuta": ["arteterapeuta"],
    "Autista": ["autista"],
    "Mediatori": ["mediatore"],
    "operatori socioassistenzaili": ["operatore_sociale"],
}


NOTE_INTERNE = [
    r"\s*[-–]?\s*da verific\w*( con [A-Z][a-zà-ù]+)?",
    r"\s*\(\?\)",
    r"\(\s*laurea\?\)",
]


def requisito_pubblico(t):
    """Rimuove dai requisiti le note di lavoro interne (verifiche, punti interrogativi, referenti)."""
    for pat in NOTE_INTERNE:
        t = re.sub(pat, "", t)
    return re.sub(r"[ \t]+", " ", t).strip(" -;")


def clean(v):
    if v is None:
        return ""
    return str(v).replace("\xa0", " ").strip()


def slug(s):
    s = s.lower()
    for a, b in (("à", "a"), ("è", "e"), ("é", "e"), ("ì", "i"), ("ò", "o"), ("ù", "u")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


def tipo_orario(turni):
    t = " ".join(turni).lower()
    if "24" in t or "notte" in t or "nott" in t:
        return "Su turni, anche notturni"
    if "ufficio" in t:
        return "Orario d'ufficio"
    if "diurn" in t or "8:" in t or "7.30" in t or "lun-ven" in t:
        return "Diurno"
    return ""


def settore_di(raw):
    if raw in SETTORI:
        return SETTORI[raw]
    if raw.startswith("Fragilità"):
        sotto = raw.split("-", 1)[1].strip() if "-" in raw else None
        return ("fragilita", sotto)
    return (None, None)


def main(xlsx_path):
    catalogo = json.loads((ROOT / "content/catalogo.json").read_text(encoding="utf-8"))
    ruoli_cat = {r["id"]: r for r in catalogo["ruoli"]}

    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb[SHEET_BASE]
    righe = []
    for idx, r in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
        vals = [clean(c) for c in r[:9]]
        if not any(vals[1:]):
            continue
        righe.append((idx, vals))

    qualita = defaultdict(list)
    servizi = OrderedDict()
    for idx, (_, settore_raw, terr_raw, tipo_raw, descr, mansione, ruolo_jd, turno, titoli) in righe:
        settore, sotto = settore_di(settore_raw)
        if not settore or not tipo_raw or not mansione:
            qualita["righe_scartate"].append({"riga": idx, "motivo": "settore, servizio o mansione mancante"})
            continue
        if terr_raw in TERRITORI:
            prov, localita = TERRITORI[terr_raw]
        elif terr_raw in ("", "da completare"):
            if settore == "disabilita":
                prov, localita = (["MI", "BG", "CR", "MN"], "Lombardia – sedi da definire")
            else:
                prov, localita = TERRITORIO_MANCANTE
            qualita["territorio_mancante"].append({"riga": idx, "servizio": tipo_raw, "mansione": mansione, "assunto": localita})
        else:
            sigle = re.findall(r"\b(BO|MO|PR|FE|RN|MI|BG|BS|CR|MN|VA|CO|VI|RO)\b", terr_raw)
            prov, localita = (sorted(set(sigle)), re.sub(r"\s+", " ", terr_raw.replace("\n", " ")))
        ruoli_ids = RUOLI.get(mansione)
        if not ruoli_ids:
            qualita["mansione_non_mappata"].append({"riga": idx, "mansione": mansione})
            continue
        if not ruolo_jd:
            qualita["job_description_mancante"].append(idx)
        if turno.lower() in ("", "da completare"):
            qualita["turno_da_completare"].append(idx)

        key = (settore, sotto, tipo_raw, terr_raw)
        if key not in servizi:
            regioni = sorted({PROVINCE[p][1] for p in prov})
            servizi[key] = {
                "id": slug(f"{SERVIZI_NOME.get(tipo_raw, tipo_raw)}-{'-'.join(prov)}"),
                "nome": SERVIZI_NOME.get(tipo_raw, tipo_raw),
                "nomeOriginale": tipo_raw,
                "settore": settore,
                "sottosettore": sotto,
                "province": prov,
                "regioni": regioni,
                "localita": localita,
                "descrizione": "",
                "descrizioneProvvisoria": False,
                "ruoli": OrderedDict(),
                "_turni": [],
            }
        s = servizi[key]
        if descr and not s["descrizione"]:
            s["descrizione"] = descr
        if turno and turno.lower() != "da completare":
            s["_turni"].append(turno)
        for rid in ruoli_ids:
            if rid not in ruoli_cat:
                raise SystemExit(f"Ruolo {rid} non presente in catalogo.json")
            ruolo = s["ruoli"].setdefault(rid, {"id": rid, "requisitiMatrice": [], "turni": [], "consulenza": False})
            pubblico = requisito_pubblico(titoli)
            if pubblico != titoli:
                qualita["requisiti_con_note_interne"].append(idx)
            if pubblico and pubblico not in ruolo["requisitiMatrice"]:
                ruolo["requisitiMatrice"].append(pubblico)
            if turno.lower() in ("consulente", "consulenza"):
                ruolo["consulenza"] = True
            elif turno and turno.lower() != "da completare" and turno not in ruolo["turni"]:
                ruolo["turni"].append(turno)

    # Descrizioni: prima riuso da stesso tipo di servizio, poi bozza provvisoria.
    per_tipo = {}
    for s in servizi.values():
        if s["descrizione"]:
            per_tipo.setdefault(s["nomeOriginale"], s["descrizione"])
    for s in servizi.values():
        if not s["descrizione"]:
            if s["nomeOriginale"] in per_tipo:
                s["descrizione"] = per_tipo[s["nomeOriginale"]]
            else:
                s["descrizione"] = DESCRIZIONI_PROVVISORIE.get(s["nomeOriginale"], "")
                s["descrizioneProvvisoria"] = True
                qualita["descrizione_servizio_mancante"].append(s["nome"] + " – " + s["localita"])
        s["orario"] = tipo_orario(s.pop("_turni"))
        s["ruoli"] = list(s["ruoli"].values())

    # Dedup id
    visti = defaultdict(int)
    for s in servizi.values():
        visti[s["id"]] += 1
        if visti[s["id"]] > 1:
            s["id"] = f"{s['id']}-{visti[s['id']]}"

    lista = list(servizi.values())
    province_usate = sorted({p for s in lista for p in s["province"]})
    base = {
        "versione": Path(xlsx_path).name,
        "province": {p: {"nome": PROVINCE[p][0], "regione": PROVINCE[p][1], "lon": PROVINCE[p][2], "lat": PROVINCE[p][3]} for p in province_usate},
        "servizi": lista,
        "statistiche": {
            "servizi": len(lista),
            "tipologieServizio": len({s["nomeOriginale"] for s in lista}),
            "professioni": len({r["id"] for s in lista for r in s["ruoli"]}),
            "province": len(province_usate),
            "regioni": len({PROVINCE[p][1] for p in province_usate}),
            "settori": len({s["settore"] for s in lista}),
        },
    }

    # Colonne "da verificare" nel foglio Servizio x Regione
    try:
        wsr = wb["Serviz -mans - region - titoli "]
        for row in wsr.iter_rows(values_only=True):
            for c in row:
                t = clean(c)
                if "da verificare" in t.lower() and len(t) < 80:
                    # solo la regione: i nomi dei referenti interni non escono dalla matrice
                    for reg in ("Emilia-Romagna", "Lombardia", "Veneto"):
                        if reg.lower() in t.lower():
                            qualita["servizio_regione_da_verificare"].append(reg)
    except KeyError:
        pass
    qualita["servizio_regione_da_verificare"] = sorted(set(qualita["servizio_regione_da_verificare"]))

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data/base-informativa.json").write_text(json.dumps(base, ensure_ascii=False, indent=1), encoding="utf-8")
    report = {k: v for k, v in qualita.items()}
    report["_sintesi"] = {k: len(v) for k, v in qualita.items()}
    report["_righe_totali"] = len(righe)
    (ROOT / "data/qualita-dati.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Servizi:", len(lista), "| stats:", base["statistiche"])
    print("Qualità dati:", report["_sintesi"])
    bundle(base, catalogo)


def bundle(base, catalogo):
    """Inserisce CSS, JS, dati e logo in un unico HTML (dist/lavora-con-noi.html)."""
    html = (ROOT / "src/index.html").read_text(encoding="utf-8")
    css = (ROOT / "src/styles.css").read_text(encoding="utf-8")
    js = (ROOT / "src/app.js").read_text(encoding="utf-8")
    logo = base64.b64encode((ROOT / "assets/logo-societa-dolce.png").read_bytes()).decode()
    dati = json.dumps({"base": base, "catalogo": catalogo}, ensure_ascii=False).replace("</", "<\\/")
    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="dati.js"></script>', f"<script>window.SD_DATI = {dati};</script>")
    html = html.replace('<script src="app.js"></script>', f"<script>\n{js}\n</script>")
    html = html.replace("../assets/logo-societa-dolce.png", f"data:image/png;base64,{logo}")
    for font in sorted((ROOT / "assets/fonts").glob("*.woff2")):
        b64 = base64.b64encode(font.read_bytes()).decode()
        html = html.replace(f"../assets/fonts/{font.name}", f"data:font/woff2;base64,{b64}")
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist/lavora-con-noi.html").write_text(html, encoding="utf-8")
    # Variante per la pubblicazione come Artifact: lo skeleton (doctype, html, head, body, meta) lo aggiunge la piattaforma.
    art = html
    for pat in (r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*", r"<body>\s*", r"</body>\s*", r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*'):
        art = re.sub(pat, "", art, flags=re.I)
    (ROOT / "dist/lavora-con-noi.artifact.html").write_text(art, encoding="utf-8")
    # dati.js per lo sviluppo locale di src/index.html
    (ROOT / "src/dati.js").write_text(f"window.SD_DATI = {dati};\n", encoding="utf-8")
    print("Prototipo: dist/lavora-con-noi.html")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
