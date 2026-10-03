# Società Dolce – nuova pagina «Lavora con noi»

Progetto UX/UI e prototipo navigabile di una pagina «Lavora con noi» pensata come piattaforma di orientamento: si parte dalla persona (chi è, cosa ha studiato, dove vuole fare la differenza, dove vuole lavorare), poi si mostrano i servizi, le professionalità e infine il matching tra il titolo dichiarato e i requisiti di ogni ruolo.

## Cosa aprire

| File | Cosa contiene |
|---|---|
| `dist/lavora-con-noi.html` | **Prototipo navigabile**, autocontenuto (si apre con doppio clic nel browser, anche offline) |
| `docs/progetto.html` | **Documento di progetto**: concept, UX flow, information architecture, wireframe desktop e mobile, UI, design system, logica di matching, specifiche tecniche, report sulla qualità dei dati |

## Struttura

```
content/catalogo.json        contenuti editoriali + regole: titoli, ruoli, eccezioni regionali, percorsi
data/base-informativa.json   generato dalla matrice Excel (servizi × territori × ruoli)
data/qualita-dati.json       campi mancanti / da verificare nella matrice
src/                         sorgenti del prototipo (index.html, styles.css, app.js, motion.js; dati.js è generato)
assets/                      logo e font Barlow self-hosted (SIL OFL)
build/                       script di build e test
```

## Aggiornare i dati

Quando cambia la matrice «Matrice titoli – regione – servizi»:

```bash
pip install openpyxl
python3 build/build_data.py "<percorso>/Matrice_titoli-_regione-servizi.xlsx"   # dati + dist/
NODE_PATH=$(npm root -g) node build/screenshots.mjs                               # percorso e2e + screenshot
NODE_PATH=$(npm root -g) node build/test_matching.mjs                             # 20 casi di matching
python3 build/build_docs.py                                                       # docs/progetto.html
```

`build_data.py` legge il foglio «Base informativa Lavora con Noi». Normalizza settori, territori e mansioni, toglie dai requisiti pubblici le note di lavoro interne e non esporta la colonna dei referenti. Le regole di matching (titoli accettati, titoli «vicini», eccezioni per regione e settore) stanno in `content/catalogo.json`.

## Note

- I testi indicati come provvisori (sintesi dei ruoli, alcune descrizioni dei servizi), le illustrazioni a tasselli e le video-testimonianze sono **segnaposto**. Vanno sostituiti con contenuti validati, foto e video reali.
- I form del prototipo non inviano né salvano dati.
- Le regole per Lombardia e Veneto sono marcate «da verificare» nella matrice e vanno validate prima del rilascio. L'elenco completo è nella sezione 10 del documento di progetto.

## Video della hero (non attivo)

`assets/hero-tasselli.mp4` e `.webm` sono l'animazione generata con Higgsfield. Per ora la hero usa l'immagine statica. Per riattivare il video, inserire dopo l'`<img>` della hero in `src/index.html`:

```html
<video class="hero-video" muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"
       data-src="../assets/hero-tasselli.mp4" data-src-webm="../assets/hero-tasselli.webm"></video>
```

`build_data.py` lo incorpora nel prototipo e `motion.js` lo avvia con la foto come anteprima.
