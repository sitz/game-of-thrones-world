# Known World — an interactive Game of Thrones map

A Google-Maps-style web map of the Game of Thrones TV universe: every kingdom, castle, city,
sea, forest and road of the known world, with **174 key show events** on a scrubbable
S1E1→S8E6 timeline and **10 animated character journeys** — all rendered in a hand-drawn
parchment cartographic style.

![Known World](public/favicon.svg)

## Features

- **Full vector map** of Westeros & Essos — coastlines, rivers, lakes, forests, mountains,
  swamps, deserts, roads, political borders and the Wall, with Google-Maps-like progressive
  label disclosure (continents → kingdoms → cities → castles → villages)
- **243 locations**, every one hand-annotated: description, region, allegiance, canon status
  (seen on screen vs. mentioned), first appearance, searchable aliases
- **174 events** across all 73 episodes — battles, weddings, deaths, sacks and supernatural
  turning points, each pinned to its place with episode metadata
- **Timeline mode**: scrub or play through the whole story; events accumulate with a recency
  fade and the current episode's pins pulse
- **Character journeys**: Jon, Daenerys, Arya, Sansa, Bran, Tyrion, Jaime, Brienne, Stannis
  and Theon — full routes that clip to the timeline, with moving head markers and death markers
- **Search** (⌘K): fuzzy autocomplete over locations, events, journeys, realms and seas
- **Layer toggles**, clickable detail panels, shareable URLs (view + timeline + selection all
  live in the hash), mobile-responsive layout

## Running it

```bash
npm install
npm run data:fetch   # one-time: vendor upstream GeoJSON/show data (pinned revisions)
node scripts/build-glyphs.mjs  # one-time: generate font glyphs
npm run dev          # data:build runs automatically, then Vite serves on :5173
```

`npm run data:build` recompiles `data/curated/` + `data/vendor/` into `public/data/`.
`npm test` runs the unit suite.

## How it's built

| Layer | Choice |
|---|---|
| Rendering | MapLibre GL JS (client-side GeoJSON sources, custom 40-layer parchment style, SDF glyphs from Cinzel & IM Fell English) |
| App | Vite + React + TypeScript, zustand, minisearch |
| Data pipeline | Node scripts: vendoring (pinned SHAs), enrichment join, polylabel label generation, zod-validated event/journey compilation |
| Curated data | Hand-written JSON in `data/curated/` — location enrichments per region, events per season, journeys per character |

The upstream base geometry is the community dataset by cadaei, theMountainGoat and Tear
(CC BY-NC-SA 3.0); scene-by-scene episode data by Jeffrey Lancaster is used to cross-check
events. See [ATTRIBUTION.md](ATTRIBUTION.md) for full credits.

**A non-commercial fan project.** Game of Thrones is © HBO; this project is unaffiliated.
