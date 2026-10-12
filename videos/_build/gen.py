#!/usr/bin/env python3
"""Neartech video series generator.

One source of truth for the three 60s videos: every frame's markup, its GSAP
timeline and the sound-design cue times live here, so animation and SFX stay
in sync. Writes compositions/frames/NN-*.html per project and
assets/audio/soundtrack.wav (music bed + SFX) per project.

Usage:  python3 gen.py frames      # write frame HTML only
        python3 gen.py audio       # write soundtrack.wav only
        python3 gen.py             # both
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.dirname(HERE)
MUSIC = os.environ.get("NT_MUSIC", os.path.join(HERE, "music.mp3"))

TEAL, COBALT, VIOLET, NAVY = "#12B3B5", "#1F5FB0", "#5B2A9E", "#0B1A6E"
BG, BG2, TXT, MUTED, DIM = "#070B2C", "#0E1442", "#F4F6FF", "#A9B1D6", "#7E87B8"
GRAD = f"linear-gradient(120deg, {TEAL} 0%, {COBALT} 50%, {VIOLET} 100%)"


# ───────────────────────────── markup helpers ─────────────────────────────
def W(text):
    """Split a line into word spans; *word* (also inside a token, e.g. Dall’*automazione*) marks teal emphasis."""
    out = []
    for tok in text.split(" "):
        inner = re.sub(r"\*(.+?)\*", r'<span class="hl">\1</span>', tok)
        out.append(f'<span class="w">{inner}</span>')
    return " ".join(out)


def head(P, idx, label):
    return (
        f'<div id="{P}-hdr" class="hdr">'
        f'<span class="brand">NEARTECH</span>'
        f'<span class="ep">{idx} / 03 · {label}</span></div>'
    )


def matrix(P, x, y, s, labels=True, quads=False):
    """N/D matrix: N on x (necessità), D on y (desiderabilità/valore umano)."""
    h = s // 2
    q = ""
    if quads:
        q = (
            f'<div id="{P}-q3" class="quad" style="left:0;top:0;width:{h}px;height:{h}px;background:rgba(91,42,158,.30)"></div>'
            f'<div id="{P}-q1" class="quad" style="left:{h}px;top:0;width:{h}px;height:{h}px;background:rgba(18,179,181,.26)"></div>'
            f'<div id="{P}-q4" class="quad" style="left:0;top:{h}px;width:{h}px;height:{h}px;background:rgba(169,177,214,.12)"></div>'
            f'<div id="{P}-q2" class="quad" style="left:{h}px;top:{h}px;width:{h}px;height:{h}px;background:rgba(31,95,176,.30)"></div>'
        )
    lab = ""
    if labels:
        lab = (
            f'<div id="{P}-axn" class="axlab" style="left:{s - 520}px;top:{s + 18}px;width:520px;text-align:right">NECESSITÀ TECNICA →</div>'
            f'<div id="{P}-axd" class="axlab axlab-v" style="left:-46px;top:{s}px;width:{s}px">VALORE UMANO →</div>'
        )
    return (
        f'<div id="{P}-mx" class="mx" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px">{q}'
        f'<div id="{P}-ax" class="axis" style="left:0;top:{s}px;width:{s}px;height:3px"></div>'
        f'<div id="{P}-ay" class="axis" style="left:0;top:0;width:3px;height:{s}px"></div>'
        f'<div id="{P}-gx" class="guide" style="left:0;top:{h}px;width:{s}px;height:1px"></div>'
        f'<div id="{P}-gy" class="guide" style="left:{h}px;top:0;width:1px;height:{s}px"></div>'
        f"{lab}</div>"
    )


def endcard(P, tagline):
    return (
        f'<div id="{P}-end" class="end">'
        f'<img id="{P}-logo" class="logo" src="public/neartech-logo.jpg" alt="Neartech — AI &amp; Consulting">'
        f'<div id="{P}-endline" class="endline"></div>'
        f'<div id="{P}-tag" class="tag">{tagline}</div></div>'
    )


CSS = """
@font-face { font-family: "Montserrat"; font-weight: 400; src: url("assets/fonts/montserrat-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 600; src: url("assets/fonts/montserrat-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 700; src: url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-weight: 400; src: url("assets/fonts/inter-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-weight: 600; src: url("assets/fonts/inter-latin-600-normal.woff2") format("woff2"); }
#root { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; color: __TXT__; font-family: "Montserrat", sans-serif; }
#__P__-bg { position: absolute; inset: 0; background: __BG__; overflow: hidden; }
#__P__-bg .glow { position: absolute; border-radius: 50%; filter: blur(90px); }
#__P__-glow1 { left: -260px; top: -320px; width: 1100px; height: 900px; background: radial-gradient(circle, rgba(18,179,181,.30), rgba(18,179,181,0) 70%); }
#__P__-glow2 { right: -300px; bottom: -380px; width: 1200px; height: 1000px; background: radial-gradient(circle, rgba(91,42,158,.34), rgba(91,42,158,0) 70%); }
#__P__-bg .dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(169,177,214,.10) 1.2px, transparent 1.4px); background-size: 48px 48px; }
#__P__-stage { position: absolute; inset: 0; }
#__P__-stage .hdr { position: absolute; left: 115px; right: 115px; top: 58px; height: 30px; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 20px; letter-spacing: .18em; }
#__P__-stage .brand { color: __TEAL__; }
#__P__-stage .ep { color: __DIM__; letter-spacing: .14em; }
#__P__-stage .line { position: absolute; margin: 0; font-weight: 800; line-height: 1.06; letter-spacing: -.025em; color: __TXT__; }
#__P__-stage .w { display: inline-block; }
#__P__-stage .hl { color: __TEAL__; }
#__P__-stage .accent { position: absolute; width: 96px; height: 6px; border-radius: 3px; background: __GRAD__; transform-origin: left center; }
#__P__-stage .chip { position: absolute; display: flex; align-items: center; gap: 14px; padding: 0 30px; height: 66px; border-radius: 100px; background: __BG2__; border: 1.5px solid rgba(18,179,181,.30); font-weight: 600; font-size: 25px; color: __TXT__; white-space: nowrap; }
#__P__-stage .chip .dot { width: 12px; height: 12px; border-radius: 50%; background: __TEAL__; flex: none; }
#__P__-stage .card { position: absolute; border-radius: 14px; background: rgba(18,179,181,.06); border: 1.5px solid rgba(18,179,181,.28); }
#__P__-stage .eyebrow { position: absolute; font-weight: 600; font-size: 20px; letter-spacing: .16em; color: __TEAL__; text-transform: uppercase; }
#__P__-stage .small { position: absolute; font-family: "Inter", sans-serif; font-weight: 400; font-size: 22px; color: __MUTED__; }
#__P__-stage .mx { position: absolute; }
#__P__-stage .axis { position: absolute; background: __MUTED__; border-radius: 2px; }
#__P__-stage .guide { position: absolute; background: rgba(169,177,214,.22); }
#__P__-stage .quad { position: absolute; }
#__P__-stage .axlab { position: absolute; font-weight: 600; font-size: 20px; letter-spacing: .14em; color: __TEAL__; }
#__P__-stage .axlab-v { transform: rotate(-90deg); transform-origin: left top; }
#__P__-stage .qlab { position: absolute; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
#__P__-stage .qlab .qn { font-family: "Inter", sans-serif; font-size: 20px; letter-spacing: .12em; text-transform: uppercase; color: __MUTED__; margin-bottom: 10px; }
#__P__-stage .qlab .qv { font-weight: 800; font-size: 44px; color: __TXT__; letter-spacing: -.02em; }
#__P__-stage .end { position: absolute; inset: 0; background: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; }
#__P__-stage .logo { width: 640px; height: auto; display: block; }
#__P__-stage .endline { width: 140px; height: 6px; border-radius: 3px; background: __GRAD__; margin-top: 10px; transform-origin: center; }
#__P__-stage .tag { margin-top: 30px; font-weight: 700; font-size: 36px; color: __NAVY__; letter-spacing: -.01em; }
"""

JS_HEAD = """
const tl = gsap.timeline({ paused: true });
const P = "__P__";
const q = (s) => "#" + P + "-" + s;
function words(id, t, o) {
  o = o || {};
  tl.fromTo(q(id) + " .w", { y: o.y ?? 44, opacity: 0, filter: "blur(10px)" },
    { y: 0, opacity: 1, filter: "blur(0px)", duration: o.d ?? 0.7, stagger: o.s ?? 0.08, ease: "power3.out" }, t);
}
function pop(id, t, o) {
  o = o || {};
  tl.fromTo(q(id), { scale: o.scale ?? 0.6, opacity: 0, x: o.x ?? 0, y: o.y ?? 0 },
    { scale: 1, opacity: 1, x: 0, y: 0, duration: o.d ?? 0.55, ease: o.ease ?? "back.out(1.8)" }, t);
}
function fadeUp(id, t, d) {
  tl.fromTo(q(id), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: d ?? 0.6, ease: "power2.out" }, t);
}
function grow(id, t, axis, d) {
  const from = axis === "y" ? { scaleY: 0 } : { scaleX: 0 };
  const to = axis === "y" ? { scaleY: 1 } : { scaleX: 1 };
  tl.fromTo(q(id), from, { ...to, duration: d ?? 0.8, ease: "power3.inOut" }, t);
}
tl.fromTo(q("glow1"), { x: -70, y: -30 }, { x: 70, y: 40, duration: __DUR__, ease: "none" }, 0);
tl.fromTo(q("glow2"), { x: 60, y: 40 }, { x: -60, y: -30, duration: __DUR__, ease: "none" }, 0);
tl.fromTo(q("hdr"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.05);
"""


def frame_html(P, dur, body, js):
    # element ids must start with a letter (CSS selectors); the composition id keeps the frame id
    cid, P = P, "n" + P
    body = body.replace(f'id="{cid}-', f'id="{P}-')
    css = CSS
    for k, v in dict(P=P, BG=BG, BG2=BG2, TXT=TXT, MUTED=MUTED, DIM=DIM, TEAL=TEAL, GRAD=GRAD, NAVY=NAVY).items():
        css = css.replace(f"__{k}__", v)
    head_js = JS_HEAD.replace("__P__", P).replace("__DUR__", str(dur))
    return f"""<template>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <style>{css}</style>
  <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080" data-duration="{dur}">
    <div id="{P}-bg" class="clip" data-start="0" data-duration="{dur}" data-track-index="0">
      <div id="{P}-glow1" class="glow" data-layout-allow-overflow></div><div id="{P}-glow2" class="glow" data-layout-allow-overflow></div><div class="dots"></div>
    </div>
    <div id="{P}-stage" class="clip" data-start="0" data-duration="{dur}" data-track-index="1">
{body}
    </div>
  </div>
  <script>{head_js}
{js}
tl.to({{}}, {{ duration: 0.001 }}, {dur - 0.001});
window.__timelines["{cid}"] = tl;
  </script>
</template>
"""


# ───────────────────────────── the series ─────────────────────────────
# Each frame: (frame_id, duration, body_fn(P), js, cues[(t, sfx)])
# Frame times are local to the frame; cues use the same numbers as the JS.

def v1():
    E, L = "01", "IL PROGETTO"
    F = []

    # 1 — Gancio (8s)
    P = "01-la-domanda"
    tasks = ["Comporre i turni", "Registrare presenze", "Redigere verbali", "Gestire sostituzioni",
             "Rispondere ai clienti", "Analizzare report", "Colloqui con le famiglie", "Pianificare acquisti"]
    pos = [(160, 300), (1340, 250), (240, 780), (1300, 760), (760, 170), (1480, 680), (120, 690), (820, 860)]
    chips = "".join(
        f'<div id="{P}-t{i}" class="chip" style="left:{x}px;top:{y}px;opacity:.0"><span class="dot"></span>{t}</div>'
        for i, ((x, y), t) in enumerate(zip(pos, tasks)))
    body = head(P, E, L) + chips + (
        f'<h1 id="{P}-l1" class="line" style="left:115px;right:115px;top:390px;font-size:96px;text-align:center">{W("L’AI entra in azienda.")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;right:115px;top:520px;font-size:96px;text-align:center">{W("Quali processi *delegare?*")}</h1>')
    js = "\n".join(
        [f'tl.fromTo(q("t{i}"), {{opacity:0, y:{20 + 6 * i}}}, {{opacity:.38, y:-{14 + 4 * i}, duration:7.5, ease:"sine.inOut"}}, {0.1 * i:.2f});' for i in range(8)]
        + ['words("l1", 0.5);', 'words("l2", 3.4, {s:0.1});',
           'tl.to(q("stage") + " .chip", {opacity:.16, duration:0.6}, 3.3);',
           'tl.fromTo(q("l2") + " .hl", {textShadow:"0 0 0px rgba(18,179,181,0)"}, {textShadow:"0 0 38px rgba(18,179,181,.75)", duration:0.8}, 4.3);'])
    F.append((P, 8, body, js, [(0.0, "riser"), (0.5, "whoosh"), (3.4, "whoosh"), (3.75, "impact")]))

    # 2 — Problema (10s)
    P = "02-incognita"
    grid = ""
    names = ["Comporre i turni", "Registrare presenze", "Colloqui con le famiglie", "Redigere verbali",
             "Gestire sostituzioni", "Accogliere un nuovo utente", "Analizzare report", "Accompagnare nel fine vita",
             "Archiviare documenti"]
    human = {2, 5, 7}
    for i, n in enumerate(names):
        cx, cy = 245 + (i % 3) * 490, 560 + (i // 3) * 104
        grid += f'<div id="{P}-g{i}" class="chip" style="left:{cx}px;top:{cy}px;width:450px;justify-content:center"><span class="dot"></span>{n}</div>'
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:178px"></div>'
        f'<h2 id="{P}-l1" class="line" style="left:115px;top:210px;font-size:58px;font-weight:700;color:{MUTED}">{W("La vera incognita:")}</h2>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;right:115px;top:290px;font-size:104px">{W("cosa deve restare *umano?*")}</h1>'
        + grid)
    js_lines = ['grow("acc", 0.3);', 'words("l1", 0.4);', 'words("l2", 2.1, {s:0.09});']
    for i in range(9):
        js_lines.append(f'pop("g{i}", {4.2 + 0.12 * i:.2f}, {{scale:.85, y:20, ease:"power3.out"}});')
    for k, i in enumerate(sorted(human)):
        t = 6.6 + 0.35 * k
        js_lines.append(f'tl.to(q("g{i}"), {{borderColor:"{TEAL}", backgroundColor:"rgba(18,179,181,.22)", boxShadow:"0 0 34px rgba(18,179,181,.45)", duration:0.5}}, {t:.2f});')
    js_lines.append(f'tl.to([{",".join(f"q(\"g{i}\")" for i in range(9) if i not in human)}], {{opacity:.35, duration:0.6}}, 6.5);')
    F.append((P, 10, body, "\n".join(js_lines),
              [(0.4, "whoosh"), (2.1, "whoosh"), (2.6, "impact"), (4.2, "ticks9"), (6.6, "chime")]))

    # 3 — Soluzione (10s)
    P = "03-mappa"
    sub = ["Comporre il piano turni", "Condurre colloqui con le famiglie", "Registrare le presenze",
           "Redigere i verbali di servizio", "Gestire le sostituzioni"]
    chips = "".join(
        f'<div id="{P}-s{i}" class="chip" style="left:1010px;top:{330 + i * 98}px"><span class="dot"></span>{t}</div>'
        for i, t in enumerate(sub))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:250px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:285px;width:760px;font-size:80px">{W("Neartech mappa il lavoro.")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:575px;width:760px;font-size:80px">{W("*Compito* per *compito.*")}</h1>'
        f'<div id="{P}-role" class="card" style="left:1010px;top:200px;width:700px;height:96px;display:flex;align-items:center;padding:0 34px">'
        f'<span style="font-weight:600;font-size:20px;letter-spacing:.16em;color:{TEAL};margin-right:22px">RUOLO</span>'
        f'<span style="font-weight:700;font-size:32px">Coordinatore di servizio</span></div>'
        f'<div id="{P}-stem" style="position:absolute;left:1040px;top:296px;width:3px;height:470px;background:rgba(18,179,181,.35);transform-origin:top center"></div>'
        + chips)
    js_lines = ['grow("acc", 0.3);', 'words("l1", 0.4);', 'pop("role", 1.6, {scale:.9, ease:"power3.out"});',
                'grow("stem", 2.9, "y", 0.6);']
    for i in range(5):
        js_lines.append(f'pop("s{i}", {3.2 + 0.32 * i:.2f}, {{x:-40, scale:.9}});')
    js_lines.append('words("l2", 6.0, {s:0.12});')
    F.append((P, 10, body, "\n".join(js_lines),
              [(0.4, "whoosh"), (1.6, "click"), (2.9, "snap")] + [(3.2 + 0.32 * i, "pop") for i in range(5)] + [(6.0, "whoosh"), (6.4, "impact")]))

    # 4 — Meccanismo: assi (12s)
    P = "04-due-misure"
    body = head(P, E, L) + (
        matrix(P, 1080, 190, 640, labels=True)
        + f'<div id="{P}-acc" class="accent" style="left:115px;top:300px"></div>'
        f'<div id="{P}-e1" class="eyebrow" style="left:115px;top:250px">N · Asse orizzontale</div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:330px;width:820px;font-size:76px">{W("*Necessità* *tecnica*")}</h1>'
        f'<div id="{P}-e2" class="eyebrow" style="left:115px;top:540px">D · Asse verticale</div>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:580px;width:860px;font-size:76px">{W("e *Valore* dell’apporto *umano.*")}</h1>'
        f'<div id="{P}-dot" style="position:absolute;left:1600px;top:300px;width:34px;height:34px;border-radius:50%;background:{TEAL};box-shadow:0 0 30px rgba(18,179,181,.8)"></div>')
    js = "\n".join([
        'grow("ax", 0.6, "x", 1.0);', 'fadeUp("axn", 1.5);', 'fadeUp("e1", 1.7);', 'grow("acc", 1.7);', 'words("l1", 1.9, {s:0.12});',
        'tl.fromTo(q("ay"), {scaleY:0, transformOrigin:"bottom center"}, {scaleY:1, duration:1.0, ease:"power3.inOut"}, 4.6);',
        'fadeUp("axd", 5.5);', 'fadeUp("e2", 5.6);', 'words("l2", 5.8, {s:0.1});',
        'grow("gx", 8.2, "x", 0.8);', 'tl.fromTo(q("gy"), {scaleY:0}, {scaleY:1, duration:0.8, ease:"power3.inOut"}, 8.3);',
        'pop("dot", 9.4, {scale:0});',
        'tl.fromTo(q("dot"), {x:-380, y:330}, {x:0, y:0, duration:1.8, ease:"power2.inOut"}, 9.4);',
    ])
    F.append((P, 12, body, js, [(0.6, "whoosh"), (1.9, "tick"), (4.6, "whoosh"), (5.8, "tick"), (8.2, "zip"), (9.4, "pop"), (11.1, "click")]))

    # 5 — Meccanismo: quadranti (12s)
    P = "05-quadranti"
    S, X, Y = 660, 630, 220
    h = S // 2
    ql = [("q1", "Baluardo umano", "Proteggere", X + h, Y), ("q2", "Collo di bottiglia", "Monitorare", X + h, Y + h),
          ("q3", "Scelta di valore", "Scegliere", X, Y), ("q4", "Automazione pura", "Automatizzare", X, Y + h)]
    labs = "".join(
        f'<div id="{P}-{k}l" class="qlab" style="left:{x}px;top:{y}px;width:{h}px;height:{h}px">'
        f'<div class="qn">{n}</div><div class="qv">{v}</div></div>' for k, n, v, x, y in ql)
    body = head(P, E, L) + (
        f'<h2 id="{P}-l0" class="line" style="left:115px;right:115px;top:118px;font-size:44px;font-weight:700;text-align:center;color:{MUTED}">{W("Ogni compito cade in un quadrante.")}</h2>'
        + matrix(P, X, Y, S, labels=True, quads=True) + labs
        + f'<h1 id="{P}-l1" class="line" style="left:1350px;top:420px;width:470px;font-size:64px">{W("Decisioni *chiare.*")}</h1>')
    order = ["q1", "q2", "q3", "q4"]
    js_lines = ['words("l0", 0.3, {y:24});', 'grow("ax", 0.3, "x", 0.6);',
                'tl.fromTo(q("ay"), {scaleY:0, transformOrigin:"bottom center"}, {scaleY:1, duration:0.6, ease:"power3.inOut"}, 0.4);',
                'fadeUp("axn", 0.7);', 'fadeUp("axd", 0.7);']
    for k, qq in enumerate(order):
        t = 1.4 + 1.6 * k
        js_lines += [f'tl.fromTo(q("{qq}"), {{opacity:0, scale:.92}}, {{opacity:1, scale:1, duration:0.6, ease:"power3.out"}}, {t:.2f});',
                     f'tl.fromTo(q("{qq}l") + " .qn", {{opacity:0, y:12}}, {{opacity:1, y:0, duration:0.5}}, {t + 0.15:.2f});',
                     f'tl.fromTo(q("{qq}l") + " .qv", {{opacity:0, y:26, filter:"blur(8px)"}}, {{opacity:1, y:0, filter:"blur(0px)", duration:0.6, ease:"power3.out"}}, {t + 0.25:.2f});']
    js_lines.append('words("l1", 8.3, {s:0.14});')
    F.append((P, 12, body, "\n".join(js_lines),
              [(0.3, "whoosh")] + [(1.4 + 1.6 * k, f"tone{k}") for k in range(4)] + [(8.3, "whoosh"), (8.55, "impact")]))

    # 6 — Chiusura (8s)
    P = "06-chiusura"
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:910px;top:300px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;right:115px;top:340px;font-size:92px;text-align:center">{W("Integrare l’AI,")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;right:115px;top:470px;font-size:72px;text-align:center">{W("proteggendo il *valore* del *lavoro* *umano.*")}</h1>'
        + endcard(P, "Integrare l’AI, proteggendo il valore umano."))
    js = "\n".join([
        'grow("acc", 0.2);', 'words("l1", 0.3);', 'words("l2", 1.6, {s:0.09});',
        'tl.fromTo(q("end"), {clipPath:"circle(0% at 50% 55%)"}, {clipPath:"circle(80% at 50% 55%)", duration:0.9, ease:"power3.inOut"}, 4.3);',
        'tl.to(q("stage") + " > :not(.end)", {opacity:0, duration:0.35}, 4.30);',
        'tl.fromTo(q("logo"), {opacity:0, scale:.9}, {opacity:1, scale:1, duration:0.9, ease:"power3.out"}, 4.8);',
        'grow("endline", 5.3);', 'fadeUp("tag", 5.6);',
        'tl.to(q("end"), {opacity:0, duration:0.5, ease:"power1.in"}, 7.45);',
    ])
    F.append((P, 8, body, js, [(0.3, "whoosh"), (1.6, "whoosh"), (4.2, "swell"), (4.8, "sting")]))
    return F


def v2():
    E, L = "02", "IL PROCESSO"
    F = []

    # 1 — Gancio (7s)
    P = "01-mansionario"
    rows = "".join(
        f'<div id="{P}-r{i}" style="position:absolute;left:44px;top:{150 + i * 44}px;width:{[460, 400, 520, 360, 480, 420, 300, 500, 440, 380][i]}px;height:14px;border-radius:7px;background:rgba(169,177,214,.22)"></div>'
        for i in range(10))
    body = head(P, E, L) + (
        f'<div id="{P}-doc" class="card" style="left:1180px;top:170px;width:620px;height:660px;background:{BG2}">'
        f'<div style="position:absolute;left:44px;top:50px;font-weight:600;font-size:18px;letter-spacing:.16em;color:{DIM}">MANSIONARIO</div>'
        f'<div style="position:absolute;left:44px;top:84px;font-weight:700;font-size:28px;color:{MUTED}">Coordinatore di servizio</div>'
        f'{rows}<div id="{P}-scan" style="position:absolute;left:0;top:140px;width:620px;height:4px;background:{TEAL};box-shadow:0 0 24px {TEAL}"></div></div>'
        f'<div id="{P}-acc" class="accent" style="left:115px;top:290px"></div>'
        f'<h2 id="{P}-l1" class="line" style="left:115px;top:325px;width:950px;font-size:60px;font-weight:700;color:{MUTED}">{W("Da un generico mansionario")}</h2>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:430px;width:980px;font-size:84px">{W("a decisioni *strategiche* *misurabili.*")}</h1>')
    js_lines = ['tl.fromTo(q("doc"), {opacity:0, x:80, rotation:3}, {opacity:1, x:0, rotation:0, duration:0.9, ease:"power3.out"}, 0.2);',
                'grow("acc", 0.5);', 'words("l1", 0.6);']
    js_lines += [f'grow("r{i}", {0.5 + 0.05 * i:.2f}, "x", 0.5);' for i in range(10)]
    js_lines += ['words("l2", 2.8, {s:0.1});',
                 'tl.fromTo(q("scan"), {y:0, opacity:0}, {y:470, opacity:1, duration:2.2, ease:"power1.inOut"}, 3.4);']
    js_lines += [f'tl.to(q("r{i}"), {{backgroundColor:"rgba(18,179,181,.55)", duration:0.2}}, {3.5 + 0.21 * i:.2f});' for i in range(10)]
    F.append((P, 7, body, "\n".join(js_lines), [(0.2, "whoosh"), (0.6, "tick"), (2.8, "whoosh"), (3.2, "impact"), (3.4, "scan")]))

    # 2 — Scomporre (10s)
    P = "02-scomporre"
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:180px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:215px;font-size:76px">{W("Ogni ruolo viene scomposto")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:310px;font-size:76px">{W("in compiti *standardizzati.*")}</h1>'
        f'<div id="{P}-src" class="card" style="left:115px;top:500px;width:1690px;height:96px;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;font-size:32px;color:{MUTED};font-style:normal">'
        f'«Accogliere l’utente e raccogliere la documentazione»</div>'
        f'<div id="{P}-a" class="chip" style="left:260px;top:520px;height:70px;font-size:28px"><span class="dot"></span>Accogliere l’utente al primo accesso</div>'
        f'<div id="{P}-b" class="chip" style="left:1000px;top:520px;height:70px;font-size:28px"><span class="dot"></span>Raccogliere la documentazione di ingresso</div>'
        + "".join(
            f'<div id="{P}-k{i}" class="eyebrow" style="left:{260 + i * 210}px;top:640px;padding:10px 18px;border-radius:100px;background:rgba(18,179,181,.12);font-size:18px">{k}</div>'
            for i, k in enumerate(["verbo", "oggetto", "vincolo", "finalità"]))
        + f'<div id="{P}-note" class="small" style="left:1130px;top:648px">Un formato unico, confrontabile tra aziende.</div>')
    js = "\n".join([
        'grow("acc", 0.3);', 'words("l1", 0.4);', 'words("l2", 1.5, {s:0.1});',
        'pop("src", 2.6, {scale:.95, ease:"power3.out"});',
        'tl.to(q("src"), {scaleX:.2, opacity:0, duration:0.35, ease:"power2.in"}, 4.4);',
        'pop("a", 4.7, {x:200, scale:.8});', 'pop("b", 4.85, {x:-200, scale:.8});',
        *[f'pop("k{i}", {6.2 + 0.3 * i:.2f}, {{y:16, scale:.8}});' for i in range(4)],
        'fadeUp("note", 7.6);',
    ])
    F.append((P, 10, body, js,
              [(0.4, "whoosh"), (1.5, "tick"), (2.6, "click"), (4.4, "snap"), (4.7, "pop"), (4.85, "pop")]
              + [(6.2 + 0.3 * i, "click") for i in range(4)]))

    # 3 — Standard globali (10s)
    P = "03-standard"
    badges = [("onet", "O*NET", "Stati Uniti", 1280, 250), ("esco", "ESCO", "Europa", 1280, 470), ("inapp", "INAPP", "Atlante del Lavoro · Italia", 1280, 690)]
    svg_lines = "".join(
        f'<path id="{P}-p{k}" d="M 900 {580} C 1080 580, 1100 {y + 55}, 1280 {y + 55}" stroke="{TEAL}" stroke-width="3" fill="none" stroke-dasharray="520" stroke-dashoffset="520"/>'
        for k, (_, _, _, _, y) in enumerate(badges))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:180px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:215px;width:1000px;font-size:72px">{W("Dati ancorati a *standard* *globali:*")}</h1>'
        f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080">{svg_lines}</svg>'
        f'<div id="{P}-task" class="chip" style="left:450px;top:546px;height:70px"><span class="dot"></span>Comporre il piano turni</div>'
        + "".join(
            f'<div id="{P}-{k}" class="card" style="left:{x}px;top:{y}px;width:520px;height:110px;padding:18px 30px">'
            f'<div style="font-weight:800;font-size:40px;color:{TXT}">{n}</div>'
            f'<div style="font-family:Inter,sans-serif;font-size:22px;color:{MUTED};margin-top:4px">{s}</div></div>'
            for k, n, s, x, y in badges)
        + f'<div id="{P}-note" class="small" style="left:115px;top:780px;width:900px">I dati internazionali parlano dei task italiani.</div>')
    js_lines = ['grow("acc", 0.3);', 'words("l1", 0.4);', 'pop("task", 1.9, {x:-60, scale:.9})']
    for k, (bid, *_rest) in enumerate(badges):
        t = 3.0 + 0.8 * k
        js_lines += [f'tl.to(q("p{k}"), {{attr:{{"stroke-dashoffset":0}}, duration:0.55, ease:"power2.out"}}, {t:.2f});',
                     f'pop("{bid}", {t + 0.35:.2f}, {{x:60, scale:.9, ease:"power3.out"}});']
    js_lines += ['fadeUp("note", 5.8);',
                 f'tl.to(q("task"), {{borderColor:"{TEAL}", boxShadow:"0 0 30px rgba(18,179,181,.5)", duration:0.5}}, 5.6);']
    F.append((P, 10, body, ";\n".join(js_lines),
              [(0.4, "whoosh"), (1.9, "pop")] + [(3.0 + 0.8 * k, "zip") for k in range(3)] + [(5.6, "chime")]))

    # 4 — L'AI struttura le evidenze (11s)
    P = "04-evidenze"
    ev = ["Benchmark su compiti equivalenti", "Uso reale osservato", "Piloti interni", "Giudizio degli esperti"]
    scatter = [(1180, 260, -8), (1500, 470, 6), (1080, 640, -4), (1460, 760, 9)]
    chips = "".join(
        f'<div id="{P}-e{i}" class="chip" style="left:1150px;top:{300 + i * 110}px;width:620px"><span class="dot"></span>{t}'
        f'<span style="margin-left:auto;font-family:Inter,sans-serif;font-weight:400;font-size:18px;color:{DIM}">fonte · data</span></div>'
        for i, t in enumerate(ev))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:300px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:335px;width:920px;font-size:76px">{W("L’AI *struttura* le evidenze,")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:530px;width:920px;font-size:76px">{W("non inventa i *punteggi.*")}</h1>'
        f'<div id="{P}-brk" style="position:absolute;left:1110px;top:300px;width:6px;height:430px;border-radius:3px;background:{GRAD};transform-origin:top center"></div>'
        + chips)
    js_lines = ['grow("acc", 0.3);', 'words("l1", 0.4);']
    for i, (x, y, r) in enumerate(scatter):
        t = 1.6 + 0.2 * i
        js_lines.append(f'tl.fromTo(q("e{i}"), {{opacity:0, x:{x - 1150}, y:{y - (300 + i * 110)}, rotation:{r}, scale:.85}}, {{opacity:.6, duration:0.4}}, {t:.2f});')
    for i in range(4):
        t = 3.0 + 0.3 * i
        js_lines.append(f'tl.to(q("e{i}"), {{x:0, y:0, rotation:0, scale:1, opacity:1, duration:0.6, ease:"power3.inOut"}}, {t:.2f});')
    js_lines += ['grow("brk", 4.4, "y", 0.6);', 'words("l2", 5.6, {s:0.11});']
    F.append((P, 11, body, "\n".join(js_lines),
              [(0.4, "whoosh"), (1.6, "ticks4")] + [(3.0 + 0.3 * i, "click") for i in range(4)] + [(5.6, "whoosh"), (5.95, "impact")]))

    # 5 — Esempio (12s)
    P = "05-esempio"
    S, X, Y = 660, 1145, 170
    h = S // 2
    cs = "height:56px;font-size:20px;padding:0 18px;gap:10px"
    body = head(P, E, L) + (
        matrix(P, X, Y, S, labels=True, quads=True)
        + f'<div id="{P}-ca" class="chip" style="left:{X + 12}px;top:{Y + h + 160}px;{cs}"><span class="dot"></span>Comporre il piano turni</div>'
        f'<div id="{P}-cb" class="chip" style="left:{X + h + 6}px;top:{Y + 110}px;{cs};border-color:{TEAL}"><span class="dot"></span>Colloquio con la famiglia</div>'
        f'<div id="{P}-acc" class="accent" style="left:115px;top:250px"></div>'
        f'<h2 id="{P}-l1" class="line" style="left:115px;top:285px;width:930px;font-size:62px;font-weight:700">{W("Dall’*automazione* operativa")}</h2>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:450px;width:950px;font-size:72px">{W("alla *protezione* del valore relazionale.")}</h1>'
        f'<div id="{P}-ill" class="small" style="left:115px;top:760px">Esempio illustrativo</div>')
    js = "\n".join([
        'grow("ax", 0.3, "x", 0.6);',
        'tl.fromTo(q("ay"), {scaleY:0, transformOrigin:"bottom center"}, {scaleY:1, duration:0.6, ease:"power3.inOut"}, 0.35);',
        *[f'tl.fromTo(q("q{k}"), {{opacity:0}}, {{opacity:.55, duration:0.6}}, {0.7 + 0.1 * k:.2f});' for k in range(1, 5)],
        'fadeUp("axn", 0.9);', 'fadeUp("axd", 0.9);',
        'tl.fromTo(q("ca"), {opacity:0, y:-260}, {opacity:1, y:0, duration:0.7, ease:"bounce.out"}, 1.8);',
        'tl.to(q("q4"), {opacity:1, duration:0.4}, 2.3);',
        'grow("acc", 2.2);', 'words("l1", 2.3);',
        'tl.fromTo(q("cb"), {opacity:0, y:-260}, {opacity:1, y:0, duration:0.7, ease:"bounce.out"}, 5.2);',
        'tl.to(q("q1"), {opacity:1, duration:0.4}, 5.7);',
        f'tl.to(q("cb"), {{boxShadow:"0 0 34px rgba(18,179,181,.6)", backgroundColor:"rgba(18,179,181,.22)", duration:0.5}}, 5.8);',
        'words("l2", 5.8, {s:0.1});', 'fadeUp("ill", 8.0);',
    ])
    F.append((P, 12, body, js, [(0.3, "whoosh"), (1.8, "drop"), (2.3, "tick"), (5.2, "drop"), (5.8, "tone3")]))

    # 6 — Chiusura (10s)
    P = "06-chiusura"
    beats = [("Gli agenti", "propongono,"), ("il codice", "calcola,"), ("l’azienda", "decide.")]
    cols = "".join(
        f'<div id="{P}-b{i}" style="position:absolute;left:{115 + i * 580}px;top:330px;width:540px">'
        f'<div style="font-weight:600;font-size:22px;letter-spacing:.14em;color:{DIM}">0{i + 1}</div>'
        f'<div style="font-weight:700;font-size:56px;color:{MUTED};margin-top:12px">{a}</div>'
        f'<div style="font-weight:800;font-size:80px;color:{TEAL if i == 2 else TXT};letter-spacing:-.025em">{b}</div></div>'
        for i, (a, b) in enumerate(beats))
    body = head(P, E, L) + cols + (
        f'<div id="{P}-bar" style="position:absolute;left:115px;top:600px;width:1690px;height:6px;border-radius:3px;background:{GRAD};transform-origin:left center"></div>'
        + endcard(P, "Gli agenti propongono, il codice calcola, l’azienda decide."))
    js = "\n".join([
        *[f'tl.fromTo(q("b{i}"), {{opacity:0, y:40, filter:"blur(10px)"}}, {{opacity:1, y:0, filter:"blur(0px)", duration:0.7, ease:"power3.out"}}, {0.5 + 1.3 * i:.2f});' for i in range(3)],
        'grow("bar", 0.5, "x", 3.2);',
        'tl.fromTo(q("end"), {clipPath:"circle(0% at 50% 55%)"}, {clipPath:"circle(80% at 50% 55%)", duration:0.9, ease:"power3.inOut"}, 5.6);',
        'tl.to(q("stage") + " > :not(.end)", {opacity:0, duration:0.35}, 5.60);',
        'tl.fromTo(q("logo"), {opacity:0, scale:.9}, {opacity:1, scale:1, duration:0.9, ease:"power3.out"}, 6.1);',
        'grow("endline", 6.6);', 'fadeUp("tag", 6.9);',
        'tl.to(q("end"), {opacity:0, duration:0.5, ease:"power1.in"}, 9.45);',
    ])
    F.append((P, 10, body, js, [(0.5, "beat"), (1.8, "beat"), (3.1, "beat2"), (5.5, "swell"), (6.1, "sting")]))
    return F


def v3():
    E, L = "03", "GOVERNANCE E VALORE"
    F = []

    # 1 — Gancio (7s)
    P = "01-metriche"
    tags = [("Fonte", "panel di esperti"), ("Data", "ottobre 2026"), ("Versione", "rubrica v1")]
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:250px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:285px;width:880px;font-size:84px">{W("Metriche *oggettive*")}</h1>'
        f'<h2 id="{P}-l2" class="line" style="left:115px;top:400px;width:900px;font-size:60px;font-weight:700">{W("con fonte, data e versione *tracciate.*")}</h2>'
        f'<div id="{P}-m" class="card" style="left:1130px;top:240px;width:640px;height:200px;background:{BG2};padding:34px 40px">'
        f'<div style="font-weight:600;font-size:20px;letter-spacing:.16em;color:{DIM}">COMPITO · VALORE UMANO</div>'
        f'<div style="margin-top:26px;width:560px;height:22px;border-radius:11px;background:rgba(18,179,181,.14)">'
        f'<div id="{P}-fill" style="width:470px;height:22px;border-radius:11px;background:{GRAD};transform-origin:left center"></div></div></div>'
        + "".join(
            f'<div id="{P}-t{i}" class="chip" style="left:{1130 + i * 30}px;top:{480 + i * 92}px;height:62px;font-size:22px">'
            f'<span class="dot"></span><span style="color:{TEAL}">{a}</span><span style="font-family:Inter,sans-serif;font-weight:400;color:{MUTED}">{b}</span></div>'
            for i, (a, b) in enumerate(tags)))
    js = "\n".join([
        'grow("acc", 0.2);', 'words("l1", 0.3);', 'pop("m", 0.6, {scale:.9, ease:"power3.out"});', 'grow("fill", 1.1, "x", 1.0);',
        'words("l2", 2.0, {s:0.08});',
        *[f'pop("t{i}", {2.9 + 0.5 * i:.2f}, {{x:-50, scale:.85}});' for i in range(3)],
    ])
    F.append((P, 7, body, js, [(0.2, "impact"), (0.3, "whoosh"), (1.1, "riser_s"), (2.0, "whoosh")] + [(2.9 + 0.5 * i, "click") for i in range(3)]))

    # 2 — Governance (10s)
    P = "02-governance"
    roles = ["Direzione HR", "Responsabili di linea", "Rappresentanza dei lavoratori", "Protezione dei dati (DPO)"]
    rcards = "".join(
        f'<div id="{P}-r{i}" class="chip" style="left:{115 + (i % 2) * 520}px;top:{560 + (i // 2) * 96}px;width:480px;height:70px;font-size:23px"><span class="dot"></span>{r}</div>'
        for i, r in enumerate(roles))
    sliders = "".join(
        f'<div id="{P}-sl{i}" style="position:absolute;left:1200px;top:{560 + i * 120}px;width:600px">'
        f'<div style="font-weight:600;font-size:20px;letter-spacing:.16em;color:{DIM}">{n}</div>'
        f'<div style="position:relative;margin-top:22px;width:600px;height:6px;border-radius:3px;background:rgba(169,177,214,.25)">'
        f'<div id="{P}-k{i}" style="position:absolute;left:0;top:-13px;width:32px;height:32px;border-radius:50%;background:{TEAL};box-shadow:0 0 22px rgba(18,179,181,.7)"></div></div></div>'
        for i, n in enumerate(["PESI", "SOGLIE"]))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:190px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:225px;width:1700px;font-size:80px">{W("La governance resta *vostra:*")}</h1>'
        f'<h2 id="{P}-l2" class="line" style="left:115px;top:340px;width:1700px;font-size:64px;font-weight:700;color:{MUTED}">{W("definirete *pesi* e *soglie.*")}</h2>'
        + rcards + sliders)
    js = "\n".join([
        'grow("acc", 0.3);', 'words("l1", 0.4);',
        *[f'pop("r{i}", {1.7 + 0.3 * i:.2f}, {{y:24, scale:.9, ease:"power3.out"}});' for i in range(4)],
        'words("l2", 3.9, {s:0.1});',
        'fadeUp("sl0", 4.9);', 'fadeUp("sl1", 5.1);',
        'tl.fromTo(q("k0"), {x:0}, {x:380, duration:1.3, ease:"power2.inOut"}, 5.7);',
        'tl.fromTo(q("k1"), {x:0}, {x:290, duration:1.3, ease:"power2.inOut"}, 6.4);',
    ])
    F.append((P, 10, body, js, [(0.4, "whoosh")] + [(1.7 + 0.3 * i, "pop") for i in range(4)] + [(3.9, "whoosh"), (4.25, "impact"), (5.7, "slide"), (6.4, "slide")]))

    # 3 — Human in the loop (10s)
    P = "03-ciclo"
    cx, cy, R = 1390, 540, 230
    nodes = [("Nuove evidenze", -90), ("Ricalcolo", 0), ("Revisione umana", 90), ("Approvazione", 180)]
    import math
    nd = ""
    for i, (n, a) in enumerate(nodes):
        x = cx + R * math.cos(math.radians(a))
        y = cy + R * math.sin(math.radians(a))
        hl = i == 2
        nd += (f'<div id="{P}-n{i}" class="chip" style="left:{x - 150:.0f}px;top:{y - 33:.0f}px;width:300px;justify-content:center;font-size:23px'
               f'{";border-color:" + TEAL if hl else ""}"><span class="dot"></span>{n}</div>')
    body = head(P, E, L) + (
        f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080">'
        f'<circle id="{P}-ring" cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="rgba(18,179,181,.55)" stroke-width="3" stroke-dasharray="1446" stroke-dashoffset="1446" transform="rotate(-90 {cx} {cy})"/></svg>'
        f'<div id="{P}-orb" style="position:absolute;left:{cx - 9}px;top:{cy - R - 9}px;width:18px;height:18px;border-radius:50%;background:{TEAL};box-shadow:0 0 20px {TEAL};transform-origin:9px {R + 9}px"></div>'
        + nd
        + f'<div id="{P}-acc" class="accent" style="left:115px;top:300px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:335px;width:900px;font-size:72px">{W("Sistema *auto-aggiornante,*")}</h1>'
        f'<h2 id="{P}-l2" class="line" style="left:115px;top:520px;width:880px;font-size:56px;font-weight:700;color:{MUTED}">{W("sempre sotto rigorosa *supervisione* *umana.*")}</h2>')
    js = "\n".join([
        'grow("acc", 0.3);', 'words("l1", 0.4);',
        'tl.to(q("ring"), {attr:{"stroke-dashoffset":0}, duration:1.4, ease:"power2.inOut"}, 1.0);',
        *[f'pop("n{i}", {1.4 + 0.45 * i:.2f}, {{scale:.8}});' for i in range(4)],
        'tl.fromTo(q("orb"), {rotation:0, opacity:0}, {rotation:720, opacity:1, duration:6.5, ease:"none"}, 3.2);',
        'words("l2", 4.4, {s:0.08});',
        f'tl.to(q("n2"), {{backgroundColor:"rgba(18,179,181,.25)", boxShadow:"0 0 40px rgba(18,179,181,.6)", scale:1.08, duration:0.5}}, 5.6);',
    ])
    F.append((P, 10, body, js, [(0.4, "whoosh"), (1.0, "riser_s")] + [(1.4 + 0.45 * i, "tick") for i in range(4)] + [(4.4, "whoosh"), (5.6, "chime")]))

    # 4 — Valore (11s)
    P = "04-valore"
    org = [(1440, 200), (1220, 400), (1660, 400), (1110, 600), (1330, 600), (1550, 600), (1770, 600)]
    org2 = [(1440, 200), (1180, 400), (1440, 400), (1700, 400), (1180, 600), (1440, 600), (1700, 600)]
    edges = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]
    edges2 = [(0, 1), (0, 2), (0, 3), (1, 4), (2, 5), (3, 6)]
    svg = "".join(f'<line id="{P}-e{k}" x1="{org[a][0]}" y1="{org[a][1]}" x2="{org[b][0]}" y2="{org[b][1]}" stroke="rgba(169,177,214,.35)" stroke-width="2"/>' for k, (a, b) in enumerate(edges))
    nodes = "".join(f'<div id="{P}-o{i}" style="position:absolute;left:{x - 34}px;top:{y - 34}px;width:68px;height:68px;border-radius:50%;background:{BG2};border:2px solid rgba(18,179,181,.5)"></div>' for i, (x, y) in enumerate(org))
    body = head(P, E, L) + (
        f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080">{svg}</svg>{nodes}'
        f'<div id="{P}-acc" class="accent" style="left:115px;top:290px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:325px;width:900px;font-size:74px">{W("Riprogettare l’organizzazione")}</h1>'
        f'<h2 id="{P}-l2" class="line" style="left:115px;top:520px;width:900px;font-size:60px;font-weight:700;color:{MUTED}">{W("con *consapevolezza* e totale *trasparenza.*")}</h2>'
        f'<div id="{P}-note" class="small" style="left:1110px;top:740px;width:700px;text-align:center">Ogni scelta spiegabile a management, lavoratori e sindacati.</div>')
    js_lines = ['grow("acc", 0.3);', 'words("l1", 0.4);']
    js_lines += [f'pop("o{i}", {1.2 + 0.12 * i:.2f}, {{scale:0}});' for i in range(7)]
    js_lines += [f'tl.fromTo(q("e{k}"), {{opacity:0}}, {{opacity:1, duration:0.4}}, {1.6 + 0.1 * k:.2f});' for k in range(6)]
    for i, ((x0, y0), (x1, y1)) in enumerate(zip(org, org2)):
        js_lines.append(f'tl.to(q("o{i}"), {{x:{x1 - x0}, y:{y1 - y0}, duration:1.0, ease:"power3.inOut"}}, 3.6);')
    for k, (a, b) in enumerate(edges2):
        js_lines.append(f'tl.to(q("e{k}"), {{attr:{{x1:{org2[a][0]}, y1:{org2[a][1]}, x2:{org2[b][0]}, y2:{org2[b][1]}}}, duration:1.0, ease:"power3.inOut"}}, 3.6);')
    js_lines += [f'tl.to(q("o{i}"), {{borderColor:"{TEAL}", backgroundColor:"rgba(18,179,181,.25)", duration:0.4}}, {5.0 + 0.1 * i:.2f});' for i in range(7)]
    js_lines += [f'tl.to(q("e{k}"), {{attr:{{stroke:"{TEAL}"}}, duration:0.4}}, {5.0 + 0.1 * k:.2f});' for k in range(6)]
    js_lines += ['words("l2", 5.4, {s:0.1});', 'fadeUp("note", 7.4);']
    F.append((P, 11, body, "\n".join(js_lines),
              [(0.4, "whoosh"), (1.2, "ticks7"), (3.6, "swoosh"), (5.0, "shimmer"), (5.4, "whoosh"), (5.75, "impact")]))

    # 5 — Limiti (10s)
    P = "05-limiti"
    tasks = ["Comporre il piano turni", "Redigere i verbali", "Colloqui con le famiglie"]
    qdots = [VIOLET, COBALT, TEAL]
    tchips = "".join(
        f'<div id="{P}-c{i}" class="chip" style="left:115px;top:{560 + i * 92}px;width:560px;height:66px;font-size:23px">'
        f'<span class="dot" style="background:{qdots[i]}"></span>{t}<span style="margin-left:auto;color:{TEAL};font-size:28px">✓</span></div>'
        for i, t in enumerate(tasks))
    people = "".join(
        f'<div id="{P}-p{i}" style="position:absolute;left:{1060 + i * 240}px;top:575px;width:150px;height:190px">'
        f'<div style="position:absolute;left:45px;top:0;width:60px;height:60px;border-radius:50%;background:rgba(169,177,214,.35)"></div>'
        f'<div style="position:absolute;left:10px;top:74px;width:130px;height:110px;border-radius:65px 65px 16px 16px;background:rgba(169,177,214,.22)"></div>'
        f'<div id="{P}-rk{i}" style="position:absolute;left:52px;top:-58px;width:46px;height:46px;border-radius:50%;border:2px solid {DIM};font-weight:700;font-size:22px;color:{DIM};display:flex;align-items:center;justify-content:center">{i + 1}</div></div>'
        for i in range(3))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:190px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:225px;width:1700px;font-size:84px">{W("Classifichiamo i *compiti,*")}</h1>'
        f'<h1 id="{P}-l2" class="line" style="left:115px;top:335px;width:1700px;font-size:84px">{W("mai i singoli *lavoratori.*")}</h1>'
        + tchips + people
        + f'<div id="{P}-x" style="position:absolute;left:1040px;top:640px;width:700px;height:8px;border-radius:4px;background:{TEAL};transform:rotate(-12deg);transform-origin:left center"></div>')
    js = "\n".join([
        'grow("acc", 0.3);', 'words("l1", 0.4);',
        *[f'pop("c{i}", {1.6 + 0.35 * i:.2f}, {{x:-40, scale:.9}});' for i in range(3)],
        *[f'fadeUp("p{i}", {3.0 + 0.15 * i:.2f});' for i in range(3)],
        'words("l2", 4.4, {s:0.1});',
        'tl.fromTo(q("x"), {scaleX:0}, {scaleX:1, duration:0.35, ease:"power3.out"}, 5.4);',
        *[f'tl.to(q("rk{i}"), {{opacity:.15, duration:0.3}}, 5.6);' for i in range(3)],
    ])
    F.append((P, 10, body, js, [(0.4, "whoosh")] + [(1.6 + 0.35 * i, "pop") for i in range(3)] + [(4.4, "whoosh"), (4.75, "impact"), (5.4, "strike")]))

    # 6 — Invito (12s)
    P = "06-invito"
    steps = [("Pilota", "documenti e persone dell’azienda"), ("Taratura", "rubrica, panel e verifica"), ("Operatività", "mappa dei ruoli in produzione")]
    st = "".join(
        f'<div id="{P}-s{i}" style="position:absolute;left:{170 + i * 590}px;top:560px;width:520px">'
        f'<div id="{P}-g{i}" style="width:40px;height:40px;border-radius:50%;background:{BG};border:4px solid {TEAL};box-shadow:0 0 22px rgba(18,179,181,.6)"></div>'
        f'<div style="margin-top:26px;font-weight:800;font-size:46px;color:{TXT}">{a}</div>'
        f'<div style="margin-top:6px;font-family:Inter,sans-serif;font-size:23px;color:{MUTED}">{b}</div></div>'
        for i, (a, b) in enumerate(steps))
    body = head(P, E, L) + (
        f'<div id="{P}-acc" class="accent" style="left:115px;top:190px"></div>'
        f'<h1 id="{P}-l1" class="line" style="left:115px;top:225px;width:1700px;font-size:80px">{W("Pilota *operativo* in poche settimane.")}</h1>'
        f'<div id="{P}-tl" style="position:absolute;left:190px;top:578px;width:1300px;height:5px;border-radius:3px;background:{GRAD};transform-origin:left center"></div>'
        + st
        + f'<h1 id="{P}-l2" class="line" style="left:115px;top:350px;width:1700px;font-size:80px">{W("*Iniziamo* il *percorso.*")}</h1>'
        + endcard(P, "Iniziamo il percorso."))
    js = "\n".join([
        'grow("acc", 0.2);', 'words("l1", 0.3);', 'grow("tl", 1.4, "x", 2.0);',
        *[f'pop("s{i}", {1.6 + 0.8 * i:.2f}, {{y:20, scale:.9, ease:"power3.out"}});' for i in range(3)],
        'words("l2", 4.6, {s:0.12});',
        'tl.fromTo(q("end"), {clipPath:"circle(0% at 50% 55%)"}, {clipPath:"circle(80% at 50% 55%)", duration:0.9, ease:"power3.inOut"}, 7.3);',
        'tl.to(q("stage") + " > :not(.end)", {opacity:0, duration:0.35}, 7.30);',
        'tl.fromTo(q("logo"), {opacity:0, scale:.9}, {opacity:1, scale:1, duration:0.9, ease:"power3.out"}, 7.8);',
        'grow("endline", 8.3);', 'fadeUp("tag", 8.6);',
        'tl.to(q("end"), {opacity:0, duration:0.6, ease:"power1.in"}, 11.35);',
    ])
    F.append((P, 12, body, js, [(0.3, "whoosh"), (1.4, "riser_s")] + [(1.6 + 0.8 * i, "gate") for i in range(3)]
              + [(4.6, "whoosh"), (4.95, "impact"), (7.2, "swell"), (7.8, "sting")]))
    return F


SERIES = {
    "neartech-01-il-progetto": (v1, 0.0),
    "neartech-02-il-processo": (v2, 66.0),
    "neartech-03-governance-e-valore": (v3, 94.0),
}


# ───────────────────────────── sound design ─────────────────────────────
SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, fc):
    """Time-varying one-pole low-pass; fc may be scalar or per-sample array."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def norm(x, peak):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def sfx_whoosh(d=0.7):
    t = t_(d)
    p = t / d
    env = np.sin(np.pi * p) ** 2
    fc = 400 + 5200 * np.sin(np.pi * p) ** 1.5
    n = onepole_lp(rng.standard_normal(len(t)), fc)
    n = n - onepole_lp(n, 180)
    return norm(n * env, 0.55)


def sfx_swoosh():
    return sfx_whoosh(1.1) * 0.9


def sfx_impact():
    t = t_(1.2)
    f = 62 * np.exp(-t * 1.6) + 34
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 3.2)
    click = onepole_lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 60)
    return norm(body + 0.35 * click, 0.8)


def sfx_pop():
    t = t_(0.14)
    f = 950 - 380 * (t / 0.14)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 34)
    return norm(s, 0.35)


def sfx_click():
    t = t_(0.05)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 1800)
    return norm(n * np.exp(-t * 140) + 0.4 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 90), 0.32)


def sfx_tick():
    t = t_(0.08)
    return norm(np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 70), 0.22)


def sfx_snap():
    n = int(0.15 * SR)
    click = np.pad(sfx_click(), (0, n))[:n]
    pop = np.pad(sfx_pop(), (0, n))[:n]
    return norm(click * 1.4 + pop, 0.45)


def sfx_zip():
    t = t_(0.22)
    f = 380 + 2600 * (t / 0.22) ** 1.4
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.22)
    return norm(s, 0.2)


def bell(freqs, d, decay=2.6, amp=0.4):
    t = t_(d)
    s = sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate(freqs))
    s += 0.25 * sum(np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9) for f in freqs[:1])
    att = np.minimum(1, t / 0.004)
    return norm(s * np.exp(-t * decay) * att, amp)


def sfx_chime():
    return bell([1046.5, 1568.0, 2093.0], 1.8, 2.4, 0.3)


NOTES = [523.25, 659.25, 783.99, 987.77]


def sfx_tone(k):
    return bell([NOTES[k], NOTES[k] * 2], 1.0, 3.2, 0.3)


def sfx_riser(d=2.6):
    t = t_(d)
    p = t / d
    n = onepole_lp(rng.standard_normal(len(t)), 300 + 5000 * p ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(180 + 520 * p ** 2) / SR) * 0.35
    env = p ** 2 * (1 - np.clip((p - 0.96) / 0.04, 0, 1))
    return norm((n + tone) * env, 0.4)


def sfx_swell():
    t = t_(1.3)
    p = t / 1.3
    chord = sum(np.sin(2 * np.pi * f * t) for f in [261.6, 329.6, 392.0, 493.9])
    n = onepole_lp(rng.standard_normal(len(t)), 2500)
    return norm((chord * 0.5 + n * 0.5) * p ** 2.2, 0.38)


def sfx_sting():
    t = t_(3.2)
    b = bell([523.25, 659.25, 783.99, 987.77, 1174.66], 3.2, 1.4, 0.45)
    sub = np.sin(2 * np.pi * 130.8 * t) * np.exp(-t * 1.2) * 0.35
    return norm(b + sub, 0.55)


def sfx_drop():
    t = t_(0.35)
    f = 300 * np.exp(-t * 9) + 70
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    return norm(s, 0.55)


def sfx_beat(hi=False):
    t = t_(0.5)
    f = 90 * np.exp(-t * 12) + 48
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    if hi:
        s = s + 0.5 * sfx_tone(3)[: len(s)]
    return norm(s, 0.6)


def sfx_scan():
    t = t_(2.2)
    s = np.sin(2 * np.pi * 2400 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / 2.2)
    return norm(s, 0.07)


def sfx_slide():
    t = t_(1.3)
    p = t / 1.3
    n = onepole_lp(rng.standard_normal(len(t)), 900 + 1500 * p)
    return norm(n * np.sin(np.pi * p) * 0.6, 0.18)


def sfx_gate():
    return norm(np.pad(sfx_click(), (0, int(0.9 * SR)))[: int(0.95 * SR)] * 1.2 + bell([1318.5], 0.95, 4, 0.2), 0.35)


def sfx_strike():
    t = t_(0.32)
    n = onepole_lp(rng.standard_normal(len(t)), 3500)
    n = n - onepole_lp(n, 600)
    return norm(n * np.sin(np.pi * np.minimum(1, t / 0.32)) * np.exp(-t * 4), 0.5)


def sfx_shimmer():
    t = t_(1.4)
    s = sum(np.sin(2 * np.pi * f * t) * np.exp(-((t - 0.12 * k) ** 2) * 30) for k, f in enumerate([1568, 1760, 2093, 2349, 2637, 3136]))
    return norm(s, 0.18)


def ticks(n, gap=0.12):
    tk = sfx_tick()
    out = np.zeros(int((n * gap + 0.1) * SR))
    for i in range(n):
        s = int(i * gap * SR)
        out[s: s + len(tk)] += tk
    return out


SFX = {
    "whoosh": sfx_whoosh, "swoosh": sfx_swoosh, "impact": sfx_impact, "pop": sfx_pop, "click": sfx_click,
    "tick": sfx_tick, "snap": sfx_snap, "zip": sfx_zip, "chime": sfx_chime, "riser": sfx_riser,
    "riser_s": lambda: sfx_riser(1.0) * 0.6, "swell": sfx_swell, "sting": sfx_sting, "drop": sfx_drop,
    "beat": sfx_beat, "beat2": lambda: sfx_beat(True), "scan": sfx_scan, "slide": sfx_slide, "gate": sfx_gate,
    "strike": sfx_strike, "shimmer": sfx_shimmer,
    "tone0": lambda: sfx_tone(0), "tone1": lambda: sfx_tone(1), "tone2": lambda: sfx_tone(2), "tone3": lambda: sfx_tone(3),
    "ticks4": lambda: ticks(4, 0.2), "ticks7": lambda: ticks(7, 0.12), "ticks9": lambda: ticks(9, 0.12),
}


def load_music(offset, dur):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", str(offset), "-t", str(dur), "-i", MUSIC,
         "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    m = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    n = int(dur * SR)
    if len(m) < n:
        m = np.pad(m, ((0, n - len(m)), (0, 0)))
    return m[:n]


def build_audio(proj, frames, offset):
    total = sum(f[1] for f in frames)
    n = int(total * SR)
    music = load_music(offset, total) * 0.42
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.8) * np.clip((total - t) / 2.5, 0, 1)
    music *= fade[:, None]
    fx = np.zeros(n)
    cache = {}
    start = 0.0
    for fid, dur, _b, _j, cues in frames:
        for (ct, name) in cues:
            if name not in cache:
                cache[name] = SFX[name]()
            s = cache[name]
            i = int((start + ct) * SR)
            j = min(n, i + len(s))
            fx[i:j] += s[: j - i]
        start += dur
    mix = music + np.stack([fx, fx], axis=1) * 0.9
    peak = np.max(np.abs(mix))
    if peak > 0.97:
        mix = mix / peak * 0.97
    out = os.path.join(VIDEOS, proj, "assets", "audio", "soundtrack.wav")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    meta = {"bgm": {"path": "assets/audio/soundtrack.wav", "volume": 1.0, "source": "host"}, "voices": [], "sfx": []}
    with open(os.path.join(VIDEOS, proj, "audio_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  audio  {proj}: {total:.0f}s, music @{offset:.0f}s, {sum(len(f[4]) for f in frames)} cues")


def build_frames(proj, frames):
    d = os.path.join(VIDEOS, proj, "compositions", "frames")
    os.makedirs(d, exist_ok=True)
    for fid, dur, body, js, _cues in frames:
        with open(os.path.join(d, f"{fid}.html"), "w") as f:
            f.write(frame_html(fid, dur, body, js))
    print(f"  frames {proj}: {len(frames)} files, {sum(f[1] for f in frames)}s")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    for proj, (fn, off) in SERIES.items():
        frames = fn()
        if what in ("all", "frames"):
            build_frames(proj, frames)
        if what in ("all", "audio"):
            build_audio(proj, frames, off)
