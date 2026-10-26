# Debt ledger — Egara 3D

Deferred work, recorded so it is not lost. Not a promise; revisit at the named gate.

| Item | Why deferred | Revisit |
|---|---|---|
| Literal extra shard slot in NG+ | The story has a fixed 12-shard set; a slot would be cosmetic. Amulet = badge + one extra life | revisit if the shard inventory expands |
| Epilogue screen has no e2e completion test | Finishing ch.8 requires a full scripted run; unit finalize test covers the state | P5 |
| Airport Road high quality at ~134 draw calls | Barrier/lamp meshes are separate; low quality is 73 | P5 (batch/merge) |
| Boss/sabotage markers overlap their world props | Functional, not yet art-directed | P5 |
| High-quality shadows cost ~20 fps on SwiftShader | One 1024 map; auto-fallback to low | device run, then tune |
| Real-device fps run (mid-tier Android) | No device in this environment | P5 |
| Remappable controls | Touch + keyboard defaults first | P5 |
| Pointer-lock option | Drag-look is the accessible default | P5 |
| Seasonal/weather variants | Content scope | after P5 |
| Audio music motif per chapter | Synth layers ship first | P5 |
| Telugu copy review by a native speaker | Machine-authored first pass ships; review later | P5 |
| Collision fidelity for curved/rotated props | OBBs for buildings; props still approximate | P5 |
| `npm run test:e2e` also collects `tests/unit/*.spec.ts`; Vitest specs use JSON imports Playwright cannot load | Pre-existing Playwright `testDir` config; smoke path used explicitly in the gate | fix `playwright.config.ts` in a dedicated gate |
| Quality defaults to high on first run | Auto-fallback handles slow devices; explicit low option exists | device run, then revisit default |
