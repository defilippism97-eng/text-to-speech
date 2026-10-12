---
format: 1920x1080
duration: 60s
message: "Dai documenti dell'azienda a una mappa dei ruoli: gli agenti propongono, il codice calcola, le persone decidono."
arc: how-to-process
audience: management e clienti
mode: collaborative
music: none  # colonna sonora premixata (traccia utente + SFX) in assets/audio/soundtrack.wav
---

# Video 2 — Il processo

Niente voce: il testo a schermo è la narrazione (`on_screen`), i suoni rinforzano ogni entrata (`sfx`).
Palcoscenico coerente: una pipeline orizzontale che avanza da sinistra a destra.

## Frame 1 — Dal documento alla decisione

- scene: Una job description piena di righe grigie scorre; il titolo la attraversa
- on_screen: "Da un generico mansionario a decisioni strategiche misurabili."  # testo validato dall’utente
- voiceover: ""
- duration: 7s
- transition_in: cut
- status: animated
- src: compositions/frames/01-mansionario.html
- type: hook
- persuasion: Rhetorical question
- beat: curiosity
- sound: paper rustle, text whoosh, impact

narrativeRole: Parte da un oggetto che ogni azienda ha (il mansionario) e promette di trasformarlo.
keyMessage: Il punto di partenza sono i documenti di lavoro che esistono già.

## Frame 2 — Scomporre e standardizzare

- scene: La frase "Accogliere l'utente e raccogliere la documentazione" si spezza in due task chip, che si riallineano in forma standard
- on_screen: "Ogni ruolo viene scomposto in compiti standardizzati."  # testo validato dall’utente
- voiceover: ""
- duration: 10s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/02-scomporre.html
- type: feature_showcase
- persuasion: Demonstration (show the mechanism running)
- beat: comprehension
- sound: snap split, click, click

narrativeRole: Mostra il primo passo: testo libero → task standard confrontabili tra aziende.
keyMessage: Lo stesso compito, descritto in modi diversi, diventa un solo record.

## Frame 3 — Agganciare gli standard

- scene: Il task chip lancia tre linee verso tre badge: O*NET · ESCO · Atlante del Lavoro INAPP
- on_screen: "Dati ancorati a standard globali: O*NET, ESCO, INAPP."  # testo validato dall’utente
- voiceover: ""
- duration: 10s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-standard.html
- type: feature_showcase
- persuasion: Causal chain (A → B → C)
- beat: momentum + confidence
- sound: line zip, line zip, line zip, chime

narrativeRole: Spiega perché il collegamento alle tassonomie sblocca il riuso delle evidenze esistenti.
keyMessage: Non si parte da zero: si riusano le fonti internazionali.

## Frame 4 — Due fonti diverse

- scene: Schermo diviso: a sinistra N si riempie di chip-evidenza (benchmark, uso osservato, piloti); a destra D di chip-persone (esperti, lavoratori, beneficiari)
- on_screen: "L’AI struttura le evidenze, non inventa i punteggi."  # testo validato dall’utente
- voiceover: ""
- duration: 11s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/04-evidenze.html
- type: feature_showcase
- persuasion: Comparison of two options + signposting
- beat: conviction
- sound: pop ×3, pop ×3, low hit

narrativeRole: Distingue l'origine delle due misure e chiarisce il ruolo limitato dell'AI nel calcolo.
keyMessage: I numeri vengono da evidenze e persone, non da un modello che "indovina".

## Frame 5 — Due compiti, due destini

- scene: Ritorna la matrice N/D della serie; due task chip vi atterrano in quadranti opposti; etichetta "esempio illustrativo"
- on_screen: "Dall’automazione operativa alla protezione del valore relazionale."  # testo validato dall’utente
- voiceover: ""
- duration: 12s
- transition_in: crossfade
- status: animated
- src: compositions/frames/05-esempio.html
- type: social_proof
- persuasion: Worked example + contrast
- beat: "aha"
- sound: drop, drop, tone

narrativeRole: Rende tangibile il metodo con due task dello stesso servizio che finiscono in zone opposte.
keyMessage: Nello stesso ruolo convivono compiti da automatizzare e compiti da proteggere.

## Frame 6 — Dal task al ruolo

- scene: I task di un ruolo si raccolgono in un baricentro sulla matrice; poi il motto in tre battute; stacco su bianco col logo
- on_screen: "Gli agenti propongono, il codice calcola, l’azienda decide."  # testo validato dall’utente
- voiceover: ""
- duration: 10s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/06-chiusura.html
- type: branding
- persuasion: Rule of three + distillation
- beat: resolve + confidence
- sound: gather whoosh, beat, beat, beat, soft logo sting
- asset_candidates: public/neartech-logo.jpg — logo ufficiale Neartech su bianco, per la chiusura

narrativeRole: Porta il risultato al livello che interessa al cliente (il ruolo) e chiude sul principio del sistema.
keyMessage: Il risultato è una mappa per riprogettare i ruoli, con le persone al comando.
