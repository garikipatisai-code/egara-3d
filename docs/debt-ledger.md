# Debt ledger — Egara 3D

Deferred work, recorded so it is not lost. Not a promise; revisit at the named gate.

| Item | Why deferred | Revisit |
|---|---|---|
| Literal extra shard slot in NG+ | The story has a fixed 12-shard set; a slot would be cosmetic. Amulet = badge + one extra life | revisit if the shard inventory expands |
| Epilogue screen has no e2e completion test | Finishing ch.8 requires a full scripted run; unit finalize test covers the state | P4 |
| Camera can clip into props/walls near arena bounds | No camera collision | P4 |
| Airport Road at 114 draw calls (budget 120) | Barrier/lamp meshes are separate | P4 (merge/batch) |
| Boss/sabotage markers overlap their world props | Functional, not yet art-directed | P4 |
| Real-device fps run (mid-tier Android) | No device in this environment | P4 |
| Remappable controls | Touch + keyboard defaults first | P4 |
| Pointer-lock option | Drag-look is the accessible default | P4 |
| Seasonal/weather variants | Content scope | after P4 |
| Audio music motif per chapter | Synth layers ship first | P4 |
| Telugu copy review by a native speaker | Machine-authored first pass ships; review later | P4 |
| Collision fidelity for curved/rotated props | Circle colliders only | P4 |
| `npm run test:e2e` also collects `tests/unit/*.spec.ts`; Vitest specs use JSON imports Playwright cannot load | Pre-existing Playwright `testDir` config; smoke path used explicitly in the gate | fix `playwright.config.ts` in a dedicated gate |
| Chapter 2/3 scene art density (giant flat sari, abstract lane props) | Function first; visual polish later | P4 |
| Adaptive render scale has no on-screen quality setting | Automatic only | P4 |
