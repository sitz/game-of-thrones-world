# Attribution

**Known World** is a non-commercial fan project, unaffiliated with HBO or George R. R. Martin.
Game of Thrones and all related names are trademarks and copyrights of their respective owners.

## Map geometry

Base geometry (coastlines, islands, lakes, rivers, roads, terrain, political regions, the Wall,
location points) by **cadaei, theMountainGoat and Tear**, based on the works of George R. R.
Martin — the dataset behind [quartermaester.info](https://quartermaester.info).

- License: [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
- Vendored from [mapbox/GOT-Inspired-Map](https://github.com/mapbox/GOT-Inspired-Map)
  (`GoTRelease/`, commit pinned in `data/vendor/MANIFEST.json`)
- Modifications: property trimming, coordinate rounding, label-point generation, and joining of
  hand-written show metadata (descriptions, allegiances, events, journeys). Derived data in
  `public/data/` inherits CC BY-NC-SA 3.0.

## Show data

Episode/scene reference data (used to cross-check hand-authored events and journeys) by
**Jeffrey Lancaster** — [jeffreylancaster/game-of-thrones](https://github.com/jeffreylancaster/game-of-thrones),
free to use with attribution.

The curated datasets in `data/curated/` (event descriptions, location write-ups, journey
waypoints) were written for this project and are licensed CC BY-NC-SA 3.0 to match the base map.

## Software & fonts

- [MapLibre GL JS](https://maplibre.org) (BSD-3-Clause)
- [Cinzel](https://fonts.google.com/specimen/Cinzel) by Natanael Gama (SIL OFL 1.1)
- [IM Fell English](https://fonts.google.com/specimen/IM+Fell+English) by Igino Marini (SIL OFL 1.1)
- Glyph PBFs generated with [fontnik](https://github.com/mapbox/node-fontnik)
