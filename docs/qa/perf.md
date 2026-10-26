# Performance protocol — Egara 3D

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G. Draw calls below 120; no per-frame
allocation in the sim, particle pool or HUD loop. Adaptive render scale
0.65–1.0 keeps frame time bounded on weak GPUs.

## Automated gate (P3)

```sh
npx vitest run tests/unit       # 61 tests
npx tsc --noEmit                # clean
npm run build                   # 654 KB raw / 174 KB gzip total
npx playwright test tests/smoke # 12 passed, 1 skipped (live)
```

Bundle split: three.js ~129 KB gzip; game code ~45 KB gzip. Budget for app code
(excluding three) is 200 KB gzip.

## Headless run — Chromium SwiftShader, 960×540

Measured after ~4 s of play; adaptive scale settles automatically. Chapters 5–8
include a short climb before the sample.

| Scene | FPS | Draw calls | Render scale | Notes |
|---|---|---|---|---|
| Ch.1 Punnami Lane | 50 | 59 | 0.90 | software GL |
| Ch.3 Shilpi's workshop | 52 | 64 | 0.90 | fill-heavy interior |
| Ch.4 Airport Road | 60 | 114 | 1.00 | near the 120 draw-call budget |
| Ch.5 Garva House | 60 | 31 | 1.00 | atrium + pillars |
| Ch.6 Diviner room | 60 | 28 | 1.00 | boss + ritual effects |
| Ch.7 Glass House | 58 | 40 | 1.00 | locked house, searchlights |
| Ch.8 The Cannon | 58 | 43 | 1.00 | Garva, needle, fire |

Software rasterisation is the limiting factor; these numbers are a floor, not a
device claim. The adaptive scaler targets <48 fps down, >57 fps up.

## Manual protocol (each release)

1. Serve the production build.
2. Desktop Chrome DevTools → Rendering → Frame Rendering Stats. Fly a full
   chapter; record min/avg FPS, draw calls (`canvas.dataset.drawCalls`) and
   render scale (`canvas.dataset.renderScale`).
3. Throttle CPU 4× and repeat — the sim is fixed-step, so game speed must not
   change.
4. Phone: mid-tier Android, 10-minute sustained play; watch thermals after
   minute 6 and the adaptive scale floor.
5. Lighthouse (mobile, throttled): LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.

## Recording

| Build | Device | CPU/GPU | Min FPS | Avg FPS | Draw calls | Scale | Notes |
|---|---|---|---|---|---|---|---|
| P3 | headless Chromium | SwiftShader | 50 | 50 | 59 | 0.90 | ch.1 lane |
| P3 | headless Chromium | SwiftShader | 52 | 52 | 64 | 0.90 | ch.3 workshop |
| P3 | headless Chromium | SwiftShader | 60 | 60 | 114 | 1.00 | ch.4 airport road |
| P3 | headless Chromium | SwiftShader | 60 | 60 | 31 | 1.00 | ch.5 Garva House |
| P3 | headless Chromium | SwiftShader | 60 | 60 | 28 | 1.00 | ch.6 Diviner |
| P3 | headless Chromium | SwiftShader | 58 | 58 | 40 | 1.00 | ch.7 Glass House |
| P3 | headless Chromium | SwiftShader | 58 | 58 | 43 | 1.00 | ch.8 Cannon |
| P3 | mid-tier Android | — | — | — | — | — | device run pending (debt) |
