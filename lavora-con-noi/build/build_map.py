#!/usr/bin/env python3
"""Genera content/mappa.json: i confini reali di Lombardia, Veneto ed Emilia-Romagna
semplificati in tracciati SVG, con le province posizionate sulla stessa proiezione.

Fonte confini: openpolis/geojson-italy (limits_IT_regions.geojson, licenza CC BY 4.0).
Uso: python3 build/build_map.py <limits_IT_regions.geojson>
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGIONI = ["Lombardia", "Veneto", "Emilia-Romagna"]
# capoluoghi (lon, lat)
PROVINCE = {
    "BO": (11.342, 44.494), "MO": (10.926, 44.647), "PR": (10.328, 44.801), "FE": (11.620, 44.836),
    "RN": (12.568, 44.060), "FC": (12.040, 44.222), "MI": (9.190, 45.464), "BG": (9.670, 45.698),
    "BS": (10.211, 45.541), "CR": (10.023, 45.133), "MN": (10.791, 45.156), "VA": (8.825, 45.818),
    "CO": (9.085, 45.808), "VI": (11.546, 45.548), "RO": (11.790, 45.070),
}
# sedi territoriali dalla brochure (oltre a Bologna, sede legale)
SEDI = {"BO": "Bologna (sede legale)", "BG": "Bergamo", "BS": "Brescia e Concesio", "CR": "Cremona", "FC": "Cesena",
        "MN": "San Giorgio Bigarello", "MO": "Castelfranco Emilia", "PR": "Parma", "VA": "Busto Arsizio", "VI": "Vicenza"}
W = 400.0
LAT0 = 45.0
KX = math.cos(math.radians(LAT0))


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [p[0] for p in polys]  # solo anello esterno


def area(r):
    return abs(sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1))) / 2


def dp(points, tol):
    """Douglas-Peucker iterativo."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-9
        best, idx = 0, None
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def main(src):
    data = json.load(open(src, encoding="utf-8"))
    feats = {f["properties"]["reg_name"]: f for f in data["features"] if f["properties"]["reg_name"] in REGIONI}
    raw = {r: [[(lon * KX, -lat) for lon, lat in ring] for ring in rings(feats[r]["geometry"])] for r in REGIONI}
    xs = [x for rs in raw.values() for ring in rs for x, _ in ring]
    ys = [y for rs in raw.values() for ring in rs for _, y in ring]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    pad = 10.0
    scale = (W - 2 * pad) / (maxx - minx)
    H = (maxy - miny) * scale + 2 * pad

    def proj(x, y):
        return ((x - minx) * scale + pad, (y - miny) * scale + pad)

    out = {"fonte": "openpolis/geojson-italy (CC BY 4.0)", "viewBox": [0, 0, W, round(H, 1)], "regioni": [], "province": {}, "sedi": SEDI}
    for r in REGIONI:
        parts = []
        biggest = max(raw[r], key=area)
        for ring in raw[r]:
            if area(ring) < area(biggest) * 0.004:  # scarta isolotti ed exclavi minuscole
                continue
            ring_p = [proj(x, y) for x, y in ring[:-1]]
            # anello chiuso: spezzo nel punto più lontano dal primo, poi semplifico le due metà
            far = max(range(len(ring_p)), key=lambda i: math.dist(ring_p[0], ring_p[i]))
            pts = dp(ring_p[:far + 1], 0.55)[:-1] + dp(ring_p[far:] + [ring_p[0]], 0.55)[:-1]
            if len(pts) < 4:
                continue
            parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
        out["regioni"].append({"nome": r, "d": "".join(parts)})
    for k, (lon, lat) in PROVINCE.items():
        x, y = proj(lon * KX, -lat)
        out["province"][k] = [round(x, 1), round(y, 1)]
    dest = ROOT / "content/mappa.json"
    dest.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(dest, "viewBox", out["viewBox"], "byte", dest.stat().st_size, {r["nome"]: len(r["d"]) for r in out["regioni"]})


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
