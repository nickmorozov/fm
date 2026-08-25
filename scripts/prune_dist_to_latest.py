#!/usr/bin/env python3
"""Slim dist/ for Porkbun static hosting (~40MB cap): keep only the newest game
version's configs and textures, drop Unity font atlases the web app never loads.

Run after `npx vite build --base=./`, from the repo root:
    python3 scripts/prune_dist_to_latest.py
Then publish dist/ as the `porkbun` branch (see nickmorozov.io README).
"""
import json
import os
import shutil

os.chdir(os.path.join(os.path.dirname(__file__), '..', 'dist'))

latest = sorted(json.load(open('parsed_configs/versions.json')), reverse=True)[0]

for base in ('parsed_configs', 'Texture2D'):
    for d in os.listdir(base):
        p = os.path.join(base, d)
        if os.path.isdir(p) and d != latest:
            shutil.rmtree(p)

json.dump([latest], open('parsed_configs/versions.json', 'w'))

cm = json.load(open('parsed_configs/config_manifest.json'))
json.dump({latest: cm[latest]}, open('parsed_configs/config_manifest.json', 'w'))

md5 = json.load(open('parsed_configs/TextureMD5Manifest.json'))
json.dump({latest: md5[latest]} if latest in md5 else {},
          open('parsed_configs/TextureMD5Manifest.json', 'w'))

# Unity SDF font atlases: referenced only by the game itself, not the web app.
tex = os.path.join('Texture2D', latest)
for f in os.listdir(tex):
    if 'SDF' in f:
        os.remove(os.path.join(tex, f))

total = sum(os.path.getsize(os.path.join(r, f))
            for r, _, fs in os.walk('.') for f in fs)
print(f'kept {latest}; dist is now {total / 1048576:.1f} MB')
