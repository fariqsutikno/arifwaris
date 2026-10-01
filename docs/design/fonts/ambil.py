#!/usr/bin/env python3
"""Unduh font pembanding dari Google Fonts ke folder ini (woff2, subset latin saja) lalu tulis fonts.css.
Jalankan sekali dengan internet: python3 docs/design/fonts/ambil.py"""
import re, sys, urllib.request, pathlib
AKAR = pathlib.Path(__file__).parent
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"}
FAMILI = ["Unbounded:wght@400;600;700", "Instrument+Serif", "Syne:wght@500;700;800", "Mona+Sans:wght@400;500;600;700",
          "Young+Serif", "Familjen+Grotesk:wght@400;500;600;700", "Hanken+Grotesk:wght@400;500;600;700",
          "Figtree:wght@400;500;600;700", "Funnel+Sans:wght@400;500;600;700", "Funnel+Display:wght@400;500;600;700",
          "Host+Grotesk:wght@400;500;600;700", "Onest:wght@400;500;600;700", "Noto+Kufi+Arabic:wght@400;600"]
def ambil(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
css_keluar, gagal = [], []
for f in FAMILI:
    try:
        css = ambil(f"https://fonts.googleapis.com/css2?family={f}&display=swap").decode()
    except Exception as e:
        gagal.append(f"{f.split(':')[0]} ({e})"); continue
    for subset, blok in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*\{.*?\})", css, re.S):
        if subset not in ("latin", "arabic"): continue  # latin-ext dan lainnya tidak perlu untuk pembanding
        u = re.search(r"url\((https://[^)]+\.woff2)\)", blok).group(1)
        nama = re.sub(r"[^a-z0-9]+", "-", (f.split(":")[0] + "-" + u.split("/")[-1]).lower())
        (AKAR / nama).write_bytes(ambil(u))
        css_keluar.append(blok.replace(u, nama))
(AKAR / "fonts.css").write_text("\n".join(css_keluar))
print(f"{len(css_keluar)} blok font ditulis ke fonts.css")
if gagal: print("GAGAL:", *gagal, sep="\n  ")
