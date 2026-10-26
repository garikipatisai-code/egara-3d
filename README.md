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
npm test           # unit tests (Vitest, 81)
npx playwright test tests/smoke   # e2e smoke + story flow (15 + live)
```

Note: `npm run test:e2e` currently also collects unit specs (pre-existing
Playwright `testDir`); use the explicit smoke path above.

## Feel & visuals (P4)

- **Flight:** throttle/hover with no auto-forward, Q/E vertical control,
  inertial acceleration/drag, speed-dependent turn and banking, perch/take-off,
  smoothed input.
- **Collision:** rotated-box slide with speed loss + bump sparks, arena edge
  response, and a camera that pulls in before walls.
- **Look:** procedural textures (concrete/asphalt/wood/marble/fabric/metal/
  windows), gradient sky + moon, textured lighting, adaptive shadows, fake glow
  halos, wing trail/boost lines, a redesigned Gali, facade/roadside/workshop/
  house/ritual detail, and a CSS vignette/grain grade.
- **Quality:** pause → Graphics: High/Low. High adds a shadow map and glow;
  low disables them and renders at a lower scale. Auto-fallback switches to low
  after one second under 50 fps; the setting persists.

## Controls

- **Hover:** no throttle = the fly stops in the air. There is no automatic
  forward motion.
- **Move:** W/S throttle forward/back; A/D turn; Q/E descend/ascend.
- **Perch:** F settles on the ground or a rooftop/desk/safe top when close; F or
  any throttle/vertical input takes off again.
- Boost: Shift; sting/sabotage: Space; pause: P/Esc.
- Look: drag with the mouse; wheel zooms.
- Touch: left stick = throttle/turn; right-half drag = look; Up/Down, Sting,
  Boost and Perch buttons sit bottom-right.
- Language: EN/TE toggle on the title, chapter select, briefing and pause.

## Story mode (P3 — complete)

All eight chapters are playable, plus the wing epilogue:

1. **First Flight** — rebirth in Punnami Lane; 4 memories; the first swatter.
2. **The Locket** — the blackout balcony; carry the locket; write your name.
3. **The Workshop** — Shilpi's bench; the first sting; the needle harness.
4. **The Airport Road** — chase the car; write a threat into the glass.
5. **Haunt the House** — cut reputation, capital and loyalty; burn the ledger.
6. **The Diviner** — break three ritual charms; survive the fire.
7. **The Glass House** — take Venu's policy; free Shilpi from the glass case.
8. **The Cannon** — break Garva's four pillars; lose a wing; fire the cannon.

The twelve memories are the P1 set; chapters 4–8 carry story cards. Collecting
all twelve earns the **wing amulet**: a golden badge and **one extra life** on
every replay (the P3 interpretation of the extra shard slot). After chapter 8,
the Storyteller closes the glass wing in the epilogue.

## Layout

```text
src/sim3d/    deterministic fixed-step flight + story state (DOM-free, tested)
src/render3/  three.js scenes, procedural props/models, chase camera, particles
src/core/     input (keyboard/mouse/touch), audio layers, saves, i18n
src/story/    story runtime state machine and saves
src/ui/       DOM/ARIA HUD, screens, cards, boss bar, epilogue
src/content3/ chapter data JSON + validation
docs/         specs, plans, research/world bible, QA
```

## Docs

- World bible: `docs/research/2026-10-26-eega-world.md`
- Story-mode spec: `docs/specs/2026-10-26-story-mode-3d.md`
- P1 plan: `docs/plans/2026-10-26-story-p1.md`
- P2 plan: `docs/plans/2026-10-26-story-p2.md`
- P3 plan: `docs/plans/2026-10-26-story-p3.md`
- P4 feel/visual spec: `docs/specs/2026-10-26-feel-visual.md`
- P4 plan: `docs/plans/2026-10-26-polish-p4.md`
- P5 control/perch spec: `docs/specs/2026-10-26-control-perch.md`
- P5 plan: `docs/plans/2026-10-26-control-p5.md`
- Performance: `docs/qa/perf.md`
- Debt: `docs/debt-ledger.md`
