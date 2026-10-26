# Performance protocol — Egara 3D

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G. Draw calls below 120; no per-frame
allocation in the sim, particle pool or HUD loop. Adaptive render scale
0.65–1.0 keeps frame time bounded on weak GPUs.

## Automated gate (P1)

```sh
npx vitest run tests/unit      # 45 tests
npx tsc --noEmit               # clean
npm run build                  # 627 KB raw / 166.6 KB gzip total
npx playwright test tests/smoke # 7 passed, 1 skipped (live)
```

Bundle split: three.js ~129 KB gzip; game code ~37 KB gzip. Budget for app code
(excluding three) is 200 KB gzip.

## Headless run — Chromium SwiftShader, 960×540

Measured after 4.5 s of play; adaptive scale settles automatically.

| Scene | FPS | Draw calls | Render scale | Notes |
|---|---|---|---|---|
| Ch.1 Punnami Lane | 54 | 59 | 0.85 | software GL; real GPU expected higher |
| Ch.3 Shilpi's workshop | 56 | 64 | 0.65 | heaviest fill scene; adaptive scale floor |
| P0 greybox baseline | 46–60 | — | 1.00 | previous gate, same machine |

Software rasterisation is the limiting factor; these numbers are a floor, not a
device claim. The adaptive scaler targets <48 fps down, >57 fps up, so a
capable GPU stays at 1.0.

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
| P1 | headless Chromium | SwiftShader | 54 | 54 | 59 | 0.85 | ch.1 lane |
| P1 | headless Chromium | SwiftShader | 56 | 56 | 64 | 0.65 | ch.3 workshop |
| P1 | mid-tier Android | — | — | — | — | — | device run pending (debt) |
