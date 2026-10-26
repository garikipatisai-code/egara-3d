# Progress ledger — P4 Feel & Visual Upgrade

Plan: `docs/plans/2026-10-26-polish-p4.md`
Spec: `docs/specs/2026-10-26-feel-visual.md`
Gate: active (owner direction 2026-10-26T19:40:00Z)

| Task | Status | Evidence |
|---|---|---|
| 1 Physics | done | velocity/accel/drag/bank/smoothing, OBB slide, bumps; 13 physics tests; 74 unit total |
| 2 Camera | done | segment/OBB clearance, pull-in, bank, boost FOV; camera-clearance tests |
| 3 Render foundation | done | procedural textures, Lambert materials, gradient sky/moon, adaptive shadow, glow sprites, CSS grade |
| 4 Gali + effects | done | segmented fly, double iridescent wings, wing blur, eye glints, antennae; trail/boost lines |
| 5 Environment detail | done | facade AC/awnings/tank/sign/puddles/bins; specimen jars/spools/magnifier; rug/paintings/plants/glassware; airport sign/reflectors |
| 6 Quality + e2e | done | High/Low toggle persisted, auto-fallback <50 fps, 13 smoke |
| 7 Perf, docs, deploy | in progress | 74 unit, tsc clean, 181 KB gz, 13 smoke; deploy pending |

## Log

- 2026-10-26T19:40Z — P4 gate opened.
- 2026-10-26T20:10Z — T1/T2 green: inertial flight, OBB slide/bumps, camera clearance; 74 unit tests.
- 2026-10-26T20:40Z — T3 green: textures/materials/sky/shadows/glow/grade.
- 2026-10-26T21:00Z — T4/T5 green: Gali redesign, trail, environment detail.
- 2026-10-26T21:10Z — T6 green: quality toggle + auto-fallback; 13 smoke.
- 2026-10-26T21:12Z — Perf: low 46–54 fps / 70–83 calls at 0.55; high 21–33 fps / 115–134 calls with shadows; auto-fallback works. Bundle 181 KB gz. Remaining: deploy + live + close.
