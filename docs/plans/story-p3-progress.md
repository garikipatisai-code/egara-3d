# Progress ledger — P3 Story Mode (chapters 7–8, epilogue)

Plan: `docs/plans/2026-10-26-story-p3.md`
Spec: `docs/specs/2026-10-26-story-mode-3d.md`
Gate: active (owner direction 2026-10-26T19:03:14Z)

| Task | Status | Evidence |
|---|---|---|
| 1 Schema + chapters 7–8 | done | all 8 enabled; ch7 policy/case; ch8 4-node boss + clip + cannon; 61 unit total |
| 2 Wing clip + finale sim | done | clip once, speed 65%/boost 0, cannon completes, amulet +1 life; 7 finale tests |
| 3 Locked house + Garva + cannon render | done | Garva, cannon, cylinder, glass case, vent, one-wing Gala; screenshots; 40/43 calls |
| 4 Epilogue + amulet + e2e | done | boss bar Garva 0/4; amulet badge + 4 hearts; all 8 unlock; 12 smoke |
| 5 Perf, docs, deploy | done | 61 unit, tsc clean, 174 KB gz, 12 smoke, Pages success, live 200 + live smoke, ch7/ch8 live verified |

## Log

- 2026-10-26T19:03Z — P3 gate opened.
- 2026-10-26T19:08Z — T1 green: all 8 chapters enabled; finale data validated.
- 2026-10-26T19:12Z — T2 green: wing clip once, cannon finale, amulet bonus life; 61 unit.
- 2026-10-26T19:17Z — T3/T4 green: Garva, cannon, glass case, vent, epilogue UI, amulet badge; 12 smoke.
- 2026-10-26T19:20Z — Perf: ch7 58/40/1.00, ch8 58/43/1.00; bundle 174 KB gz.
- 2026-10-26T19:23Z — Deployed `40d6728`; live 200; live smoke passed; ch7 objective and ch8 Garva boss bar verified live with no page errors.
- 2026-10-26T19:25Z — Final polish: cleared the oxygen cylinder from the cannon sightline; deployed; live 200.
