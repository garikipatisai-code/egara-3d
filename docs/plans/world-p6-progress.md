# Progress ledger — P6 World Realism

Plan: `docs/plans/2026-10-26-world-p6.md`
Spec: `docs/specs/2026-10-26-world-realism.md`
Gate: active (owner direction 2026-10-26T23:53:45Z)

| Task | Status | Evidence |
|---|---|---|
| 1 PBR/post/env/shadows | done | Standard + bump maps, PMREM env, bloom/grade, 2048 shadows high, Lambert/no-post low; tier swap |
| 2 Lane realism | done | facade/shopfront textures, five shops, temple, tea stall, auto/scooters, dog/pigeons, festival lights, transformer, laundry, humans |
| 3 Workshop + hub | done | sketches, locket display, tools/jars/spools, dawn; hub keepsakes/book |
| 4 House/airport/ritual/finale | done | guards/bar/sofas/sconces; terminal/plane/bus/agent; fire/embers; ritual brass |
| 5 Characters + Gali | done | PBR fly, bangles/pallu/earrings, lapels/pocket/brows, diviner beard/beads |
| 6 Ambient life + audio | done | human sway, dog/pigeons, bus/plane; city/traffic/fire layers; dust/embers |
| 7 Perf, docs, deploy | done | 81 unit, tsc clean, 194 KB gz, 15 smoke, Pages success, live 200 + live smoke/high/low checks |

## Log

- 2026-10-26T23:53Z — P6 gate opening.
- 2026-10-27T00:05Z — T1 green: PBR/bump materials, PMREM env, composer bloom/grade, 2048 shadows, low-tier Lambert swap.
- 2026-10-27T00:15Z — T2/T3 green: textured facade/shopfront street, temple/tea/auto/animals/lights; workshop sketches/locket; hub keepsakes.
- 2026-10-27T00:22Z — T4/T5/T6 green: guards/bar/sofas/terminal/plane/bus, character detail, city/fire audio, dust/embers.
- 2026-10-27T00:29Z — Perf: high 181–250 calls (4–13 fps SwiftShader), low 125–204 calls (54–60 fps); 194 KB gz.
- 2026-10-27T00:33Z — Deployed `f729b5d`; live 200; live smoke passed; live auto-low 42 fps/152 calls, forced-high 4 fps/228 calls with no page errors. Budget deviation high 250/low 204 recorded in perf/debt. P6 complete.
