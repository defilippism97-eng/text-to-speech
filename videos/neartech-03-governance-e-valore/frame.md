---
version: alpha
name: Neartech Dark — Frame (video / frame layer)
description: >
  Bespoke brand frame system for Neartech (AI & Consulting), derived from the supplied logo.
  Deep-navy ground for content frames, the logo's teal → cobalt → violet gradient as the brand
  signature, a single teal accent for emphasis, Montserrat display (matching the logo's geometric
  wordmark) + Inter body. Consulting-grade restraint: tinted cards, no shadows, generous space.
  Closing card is the one light frame: white ground with the original logo untouched.
unit: the frame — 1920×1080 (16:9, LinkedIn)
principle: atoms are sacred · composition is free · text carries the story (feed plays muted)

colors:
  bg: "#070B2C"            # deep navy ground (content frames)
  bg-raised: "#0E1442"     # slightly lifted panels
  primary: "#12B3B5"       # Neartech teal — the single emphasis accent
  secondary: "#5B2A9E"     # Neartech violet — gradient end, quadrant tints only
  navy: "#0B1A6E"          # logo wordmark navy — used on the light closing card
  text: "#F4F6FF"          # near-white headlines
  text-muted: "#A9B1D6"    # body / labels
  text-light: "#6E77A8"    # tertiary / colophon
  card-bg: "rgba(18,179,181,0.06)"
  border: "rgba(18,179,181,0.28)"
  accent-light: "rgba(18,179,181,0.14)"
  light-bg: "#FFFFFF"      # closing card ground (logo as supplied)
  gradient: "linear-gradient(120deg, #12B3B5 0%, #1F5FB0 50%, #5B2A9E 100%)"

radii:
  pill: "100px"
  card-lg: "14px"
  card-md: "12px"
  card-sm: "10px"
  circle: "50%"

typography:
  body:       { fontFamily: "Inter", cqw: 1.1, weight: 400, lineHeight: 1.5, color: "text-muted" }
  eyebrow:    { fontFamily: "Montserrat", cqw: 0.95, weight: 600, tracking: "0.14em", upper: true, color: "primary" }
  label:      { fontFamily: "Montserrat", cqw: 1.25, weight: 600, lineHeight: 1.25, color: "text" }
  h3:         { fontFamily: "Montserrat", cqw: 2.0, weight: 600, lineHeight: 1.2, tracking: "-0.01em", color: "text" }
  h2:         { fontFamily: "Montserrat", cqw: 3.2, weight: 700, lineHeight: 1.1, tracking: "-0.02em", color: "text" }
  h1:         { fontFamily: "Montserrat", cqw: 5.2, weight: 800, lineHeight: 1.04, tracking: "-0.025em", color: "text" }
  stat-num:   { fontFamily: "Montserrat", cqw: 6.0, weight: 800, lineHeight: 1.0, color: "primary" }

spacing:
  pad-x: "6cqw"
  pad-y: "6cqh"
  gap: "1.6cqw"
  accent-line: "72px × 5px, gradient"

components:
  card-tinted:
    backgroundColor: "{colors.card-bg}"
    border: "1.5px solid {colors.border}"
    rounded: "{radii.card-lg}"
    shadow: "none"
    description: "Task cards, source chips, role cards. Never opaque, never shadowed."
  task-chip:
    backgroundColor: "{colors.bg-raised}"
    border: "1.5px solid {colors.border}"
    rounded: "{radii.pill}"
    typography: "{typography.label}"
    description: "A single task, written verb + object (e.g. «Comporre il piano turni»)."
  accent-line:
    background: "{colors.gradient}"
    size: "72×5, 3px radius"
    description: "Above headlines; the brand gradient in miniature."
  matrix:
    axes: "1.5px {colors.text-light} hairlines, labelled N (x) and D (y) in {typography.eyebrow}"
    quadrants: "Q1 top-right teal tint · Q2 bottom-right cobalt tint · Q3 top-left violet tint · Q4 bottom-left neutral"
    description: "The hero visual of the series — the N/D matrix. Same geometry in every video."
  brand-glow:
    background: "radial {colors.gradient} at 12% opacity, blurred"
    description: "Atmosphere on hook and closing frames only."
  end-card:
    backgroundColor: "{colors.light-bg}"
    logo: "public/neartech-logo.jpg, untouched, centered, ~34cqw wide"
    description: "Closing frame of every video. The only light frame."
---

# Neartech Dark — Frame

## Overview

A consulting briefing in the brand's own colors. Deep navy carries every content frame; the logo's
teal → cobalt → violet gradient is the signature, used sparingly (accent lines, the N/D matrix
tints, atmosphere glows). **Teal is the single emphasis color** for the word that matters in a line;
headlines stay near-white. Violet never colors text — it lives in gradients and the Q3 tint.

The voice is **Montserrat** (geometric, bold — echoes the NEARTECH wordmark) for display, labels and
eyebrows, **Inter** for any supporting line.

## The Frame

- 1920×1080. Author sizes in `cqw` against a `container-type: size` ground.
- Safe area: 6cqw sides, 6cqh top/bottom. LinkedIn overlays UI at the bottom-left on mobile — keep
  key text out of the bottom 10%.
- **Muted-first legibility:** the feed autoplays without sound. Every frame must read with audio
  off; load-bearing lines ≥ 2.0cqw, ≤ 8 words on screen at once, each line held ≥ 1.8s.
- Squint test: one near-white headline or one teal word dominates each moment.

## Colors

Navy ground, near-white headlines, muted lavender-gray body, teal emphasis. Quadrant tints may use
teal / cobalt / violet at ≤ 18% opacity. The closing card switches to white so the supplied logo
(navy + teal wordmark on white) appears exactly as provided — never recolor or place it on navy.

## Depth & Surface

Tinted cards (6% teal fill, 28% teal border), no box-shadow. Depth from layering and the soft
brand glow on hook / closing frames only.

## Do / Don't

- Do: one idea per moment; type that arrives on a sound cue; the matrix as the recurring stage.
- Don't: formulas, SQL, dense tables, stock imagery, more than one accent color per line, the logo
  on a dark ground.
