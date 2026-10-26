# Egara 3D

Full-3D flight story game (three.js, static hosting). Original story, names,
art and audio — no film assets. The world is fly-scale: a lane, a workshop, an
airport road, a glass house, and the people who loom over them.

**Play:** https://garikipatisai-code.github.io/egara-3d/

## Commands

```sh
npm install
npm run dev        # local dev server
npm run build      # static build in dist/
npm test           # unit tests (Vitest, 54)
npx playwright test tests/smoke   # e2e smoke + story flow (9 + live)
```

Note: `npm run test:e2e` currently also collects unit specs (pre-existing
Playwright `testDir`); use the explicit smoke path above.

## Controls

- Fly: WASD or arrows; Shift boost; Space sting / sabotage; P/Esc pause.
- Look: drag with the mouse; wheel zooms.
- Touch: left half is a virtual stick; drag the right half to look; Sting and
  Boost buttons sit bottom-right.
- Language: EN/TE toggle on the title, chapter select, briefing and pause.

## Story mode (P2)

Chapters 1–6 are playable; chapters 7–8 are specified and locked:

1. **First Flight** — rebirth in Punnami Lane; 4 memories; the first swatter.
2. **The Locket** — the blackout balcony; carry the locket; write your name.
3. **The Workshop** — Shilpi's bench; the first sting; the needle harness.
4. **The Airport Road** — chase the car; write a threat into the glass.
5. **Haunt the House** — cut reputation, capital and loyalty; burn the ledger.
6. **The Diviner** — break three ritual charms; survive the fire.

Chapter select enforces progression; shards, best time, mute and language are
saved in `egara3d.save` (v2, migrates v1). The twelve memories are the P1 set;
chapters 4–6 carry story cards.

## Layout

```text
src/sim3d/    deterministic fixed-step flight + story state (DOM-free, tested)
src/render3/  three.js scenes, procedural props/models, chase camera, particles
src/core/     input (keyboard/mouse/touch), audio layers, saves, i18n
src/story/    story runtime state machine and saves
src/ui/       DOM/ARIA HUD, screens, cards, boss bar
src/content3/ chapter data JSON + validation
docs/         specs, plans, research/world bible, QA
```

## Docs

- World bible: `docs/research/2026-10-26-eega-world.md`
- Story-mode spec: `docs/specs/2026-10-26-story-mode-3d.md`
- P1 plan: `docs/plans/2026-10-26-story-p1.md`
- P2 plan: `docs/plans/2026-10-26-story-p2.md`
- Performance: `docs/qa/perf.md`
- Debt: `docs/debt-ledger.md`
