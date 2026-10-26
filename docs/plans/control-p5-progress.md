# Progress ledger — P5 Control & Perch

Plan: `docs/plans/2026-10-26-control-p5.md`
Spec: `docs/specs/2026-10-26-control-perch.md`
Gate: activating (owner direction 2026-10-26T22:01:15Z)

| Task | Status | Evidence |
|---|---|---|
| 1 Throttle/hover/perch sim | done | 7 control tests; 81 unit total; perch state hashed |
| 2 Input + touch + HUD | done | W/S throttle, Q/E vertical, F perch; touch stick + Up/Down/Perch; EN/TE copy |
| 3 Perch visuals + telemetry | done | slow wingbeats, no trail, perch/airborne toast, `data-speed/perched/altitude` |
| 4 Story reachability + regression | done | 15 smoke; hover/perch e2e; all chapters/tests green |
| 5 Perf, docs, deploy | in progress | 81 unit, tsc clean, 183 KB gz; deploy pending |

## Log

- 2026-10-26T22:01Z — P5 gate opening: hover-first throttle, vertical control, perch.
- 2026-10-26T22:30Z — T1 green: zero-throttle hover, W/S throttle, Q/E vertical, perch/detach; 81 unit.
- 2026-10-26T22:50Z — T2/T3 green: keyboard/touch remap, Up/Down/Perch buttons, slow wings, telemetry/toasts.
- 2026-10-26T23:02Z — T4 green: 15 smoke; hover and ground-perch e2e pass. Remaining: deploy + close.
