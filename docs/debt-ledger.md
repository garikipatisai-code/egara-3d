# Debt ledger — Egara 3D

Deferred work, recorded so it is not lost. Not a promise; revisit at the named gate.

| Item | Why deferred | Revisit |
|---|---|---|
| Chapters 7–8 (Glass House, Cannon) | P2 gate is chapters 4–6 | P3 |
| Garva boss as four resource nodes | Needs paranoia/haunt systems first | P3 |
| NG+ amulet effect | Needs 12 shards + epilogue | P3 |
| Camera can clip into props/walls near arena bounds | No camera collision in P2 | P4 |
| Airport Road at 114 draw calls (budget 120) | Barrier/lamp meshes are separate | P4 (merge/batch) |
| Boss/sabotage markers overlap their world props | Functional, not yet art-directed | P4 |
| Real-device fps run (mid-tier Android) | No device in this environment | P4 |
| Remappable controls | Touch + keyboard defaults first | P4 |
| Pointer-lock option | Drag-look is the accessible default | P4 |
| Seasonal/weather variants | Content scope | after P3 |
| Audio music motif per chapter | Synth layers ship first | P4 |
| Telugu copy review by a native speaker | Machine-authored first pass ships; review later | P4 |
| Chapter 4 car physics (kinematic vs simulated) | Needs a dedicated design pass | P2 gate |
| Collision fidelity for curved/rotated props | Circle colliders only in P1 | P2 |
| `npm run test:e2e` also collects `tests/unit/*.spec.ts`; Vitest specs use JSON imports Playwright cannot load | Pre-existing Playwright `testDir` config; smoke path used explicitly in the gate | fix `playwright.config.ts` in a dedicated gate |
| Chapter 2/3 scene art density (giant flat sari, abstract lane props) | Function first; visual polish later | P4 |
| Adaptive render scale has no on-screen quality setting | Automatic only | P4 |
