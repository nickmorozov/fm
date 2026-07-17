# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Forge Master Wiki & Calculator (FM)** — a 100% fanmade React SPA: calculators, a wiki/encyclopedia, and a persistent profile system for the mobile game *Forge Master*. All game numbers come from the game's own parsed `.json` configs (see Data architecture). Live at `1vcian.me/fm`.

This is a **fork** of upstream [`1vcian/fm`](https://github.com/1vcian/fm) (`upstream` remote), pushed to `nickmorozov/fm` (`origin`). Follow *upstream* conventions, not this workspace's house style — there is no shared SFDX/template tooling here.

## Commands

```bash
npm run dev              # update-configs, then vite dev server on :3000
npm run build            # update-contributors + update-configs + tsc -b + vite build
npm run preview          # serve the production build
npm run lint             # eslint . --ext ts,tsx --max-warnings 0
npm run update-configs   # regenerate parsed_configs manifests (run after adding/removing config files or textures)
```

There is **no test runner** configured. `scratch.js`, `slice_by_guid.py` (Unity sprite-atlas slicer), and `scripts/debug_sim.ts` are dev/data-prep one-offs, not part of the app build.

> Note: `npm run lint` is wired up but no `eslint.config.*` / `.eslintrc*` exists in the repo — it will fail until a config is added. Don't assume lint is part of a working pipeline.

## Stack

React 18 + TypeScript (strict) + Vite 5, Tailwind CSS 3, react-router-dom 6 (HashRouter), framer-motion, @dnd-kit (drag/drop), lucide-react (icons), react-toastify, lz-string (profile sharing). Path alias `@/* → src/*` (set in both `tsconfig.json` and `vite.config.ts`). Vite `base` is `/fm/` in production, `/` in dev — never hardcode asset paths; use `import.meta.env.BASE_URL`.

## Data architecture (the core thing to understand)

Game data is **not bundled**. It lives as static assets and is fetched at runtime, versioned by game patch:

```
public/parsed_configs/
  versions.json                 # array of version strings (e.g. "2026_05_23_14_08")
  config_manifest.json          # { version: [file.json, ...] }  — generated
  TextureManifest.json          # generated
  TextureMD5Manifest.json       # generated
  <version>/*.json              # per-version game config (ForgeConfig, EggLibrary, MountLibrary, ...)
  <global manifest files>       # ManualSpriteMapping, IconsMap, TechTreeMapping, AutoItemMapping
public/Texture2D/<version>/*.png  # sprite atlases
```

- `scripts/update_config_manifest.ts` scans `public/parsed_configs/<version>/` and `public/Texture2D/` to regenerate the three manifest files. **Run `npm run update-configs` (or `dev`/`build`, which do it automatically) after adding a new version folder or any config/texture file.** Adding a game patch = drop the parsed folder in, append the version string to `versions.json`, re-run.
- `GameDataContext` fetches `versions.json`, sorts descending, and exposes `selectedVersion` (the active patch) plus an `isDebug` flag toggled by `?debug=true` in the URL.
- `useGameData<T>(fileName)` is **the** data-access hook. It resolves the URL from `selectedVersion` (or treats a fixed set of `GLOBAL_CONFIG_FILES` as version-independent), and dedupes requests via module-level `dataCache` + `promiseCache` so concurrent consumers share one fetch. Always load config through this hook, not raw `fetch`.

## App structure

- `src/App.tsx` — provider stack + all routes. Order: `GameDataProvider → ProfileProvider → ComparisonProvider → TreeModeProvider → HashRouter`. `AppShell` (in `components/Layout`) is the layout route; everything else nests under it.
- `src/context/` — global state:
  - `GameDataContext` — selected game version + debug flag.
  - `ProfileContext` — the user's profiles (current level/equipment/research). Persisted to `localStorage` (`forgeMaster_profiles`, `forgeMaster_activeProfileId`), shareable via lz-string-compressed URL strings. `sanitizeProfile` strips skins whose `type` no longer matches their slot (handles cross-version drift).
  - `ComparisonContext`, `TreeModeContext` — UI/calculator state (item comparison, tech-tree planning mode).
- `src/hooks/` — calculator/business logic, one hook per feature (`useForgeCalculator`, `useTreePlanner`, `useBattleSimulation`, `useEggsCalculator`, `useProfileStats`, …). This is where game math lives; pages are mostly presentational shells over these hooks.
- `src/utils/` — pure engines: `statEngine`, `statsCalculator`, `BattleEngine`/`BattleSimulator`/`PvpBattleEngine`, `techUtils`, `guildWarUtils`, `itemCalculations`, plus asset resolvers (`itemAssets`, `skinSprites`).
- `src/pages/` — route components (Wiki pages, Calculators under `pages/Calculators/`, Profile/PVP, Info pages).
- `src/components/` — grouped by domain: `Layout/`, `Profile/`, `Battle/`, `Pvp/`, `Wiki/`, `UI/`.
- `src/constants/` — hand-maintained data not derived from game configs (e.g. `forgeData`, `skillData`, `eggData`).

## Conventions

- TS strict mode is on, but `noUnusedLocals`/`noUnusedParameters` are **off** — unused vars won't fail the build.
- 4-space indentation, single quotes (matches existing files).
- Mobile-first: pages assume small viewports first, then scale up.
- New game-data reads go through `useGameData`; new derived numbers go in a `hooks/` calculator or `utils/` engine, not inline in a page.
- When changing anything under `public/parsed_configs/` or `public/Texture2D/`, regenerate manifests before committing.
