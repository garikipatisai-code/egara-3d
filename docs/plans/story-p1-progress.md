# Progress ledger — P1 Story Mode (egara-3d)

Plan: `docs/plans/2026-10-26-story-p1.md`
Spec: `docs/specs/2026-10-26-story-mode-3d.md`
World bible: `docs/research/2026-10-26-eega-world.md`
Gate: active (owner direction 2026-10-26T17:35:50Z)

| Task | Status | Evidence |
|---|---|---|
| 1 Content + i18n | done | 8 defs, 3 enabled, 12 shards, EN+TE; content validation + i18n tests; 7 tests |
| 2 Story sim core | done | objectives reach/collect/survive/write/destroy, events, hash; 9 tests; deterministic |
| 3 Shards, hazards, checkpoints | done | pickup/checkpoint/respawn, wind/swatter/tweezer/lamp, paranoia; 7 tests |
| 4 Render worlds | done | lane/balcony/workshop/hub, props, Shilpi, shards, hazards, marker; screenshots at 960×540; 59–64 draw calls |
| 5 Runtime + UI | done | title/select/briefing/play/pause/debrief/cards; 8 cards; lock rules; 6 runtime tests; 6 e2e flows |
| 6 Input, save v2, audio | done | touch stick + buttons, v1→v2 migration, buzz/wind/room/tension layers; 4 save tests + touch e2e |
| 7 Perf, docs, deploy | in progress | unit 45/45, tsc clean, build 166.6 KB gz, smoke 7/7; deploy pending |

## Log

- 2026-10-26T17:35Z — world bible written from four research streams; spec + plan approved; P1 = framework + chapters 1–3.
- 2026-10-26T17:40Z — T1 green: content schema, 8 chapter defs (3 enabled), 12 shards, EN/TE, validation tests.
- 2026-10-26T17:50Z — T2/T3 green: deterministic story sim, objective cascade, shards/checkpoints, three hazards, paranoia.
- 2026-10-26T17:58Z — T5 green: runtime + DOM screens; chapter select shows 8 cards, locks enforced, language persists.
- 2026-10-26T18:00Z — T6 green: touch stick/buttons, save v2 migration, ambient audio layers.
- 2026-10-26T18:03Z — T4 visual pass: lane/balcony/workshop/hub screenshots; locket prop scaled to read; adaptive resolution added after headless FPS pass.
- 2026-10-26T18:05Z — Perf: 54 fps / 59 calls / 0.85 scale (ch.1), 56 fps / 64 calls / 0.65 scale (ch.3) on SwiftShader; bundle 166.6 KB gz. Docs updated. Remaining: deploy + live smoke + gate close.
