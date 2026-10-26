# Egara 3D

Full-3D flight rebuild of Egara (three.js, static hosting). Original story,
names, art and audio — no film assets.

**Play:** https://garikipatisai-code.github.io/egara-3d/ (after first deploy)

## Commands

```sh
npm install
npm run dev        # local dev server
npm run build      # static build in dist/
npm test           # unit tests (Vitest)
npm run test:e2e   # Playwright smoke tests
```

## Layout

```text
src/sim3d/    deterministic fixed-step flight sim (DOM-free, tested)
src/render3/  three.js scene, procedural models, chase camera, particles
src/core/     input, audio, saves, i18n
src/ui/       DOM/ARIA HUD and menus
src/content3/ chapter data (later phases)
```

## Status

P0 vertical slice in progress (see docs/plans/2026-10-26-slice.md).
