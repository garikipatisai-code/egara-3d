# Progress ledger — P2 Story Mode (chapters 4–6)

Plan: `docs/plans/2026-10-26-story-p2.md`
Spec: `docs/specs/2026-10-26-story-mode-3d.md`
Gate: active (owner direction 2026-10-26T18:27:29Z)

| Task | Status | Evidence |
|---|---|---|
| 1 Schema + chapters 4–6 | done | actors/boss/sabotage/fire schema; 6 enabled chapters; content validation |
| 2 Actors + escort/sabotage/boss sim | done | car path/stop, escort decay, actor-relative marks, 3 nodes, fire gating, paranoia wave; 8 tests |
| 3 Road / house / Diviner render | done | airport road, Garva House, ritual room, moving car, Diviner, fire/smoke; screenshots; 114/31/28 draw calls |
| 4 Boss bar + HUD + e2e | done | boss bar shows/clears; ch4 unlock; 0/0 meta; 2 e2e; 9 smoke total |
| 5 Perf, docs, deploy | in progress | 54 unit, tsc clean, 171 KB gz, perf rows; deploy pending |

## Log

- 2026-10-26T18:27Z — P2 gate opened.
- 2026-10-26T18:32Z — T1 green: six enabled chapters, car actor, three pillars, Diviner boss, cards EN/TE.
- 2026-10-26T18:36Z — T2 green: kinematic car, escort, actor-relative write, sabotage/boss nodes, fire gating, paranoia wave; 54 unit total.
- 2026-10-26T18:42Z — T3/T4 green: airport road, Garva House, ritual room; boss bar; 2 P2 e2e; visual pass.
- 2026-10-26T18:46Z — Perf: ch4 60/114/1.00, ch5 60/31/1.00, ch6 60/28/1.00; ch1 50/59/0.90, ch3 52/64/0.90. Docs updated. Remaining: deploy + live + close.
