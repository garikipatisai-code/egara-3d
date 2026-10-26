# Performance protocol — Egara 3D

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G. Draw calls below 150 high / 90 low; no
per-frame allocation in the sim, particle pool or HUD loop. Adaptive render
scale 0.50–1.0; high quality uses one 1024 shadow map, low quality uses none.

## Automated gate (P4)

```sh
npx vitest run tests/unit       # 74 tests
npx tsc --noEmit                # clean
npm run build                   # 688 KB raw / 181 KB gzip total
npx playwright test tests/smoke # 13 passed, 1 skipped (live)
```

Bundle split: three.js ~129 KB gzip; game code ~52 KB gzip. Budget for app code
(excluding three) is 200 KB gzip.

## Headless run — Chromium SwiftShader, 960×540

High quality is GPU-targeted; the auto-fallback switches to low after one
second below 50 fps. Low samples are taken after the fallback settles.

| Scene | Mode | FPS | Draw calls | Scale | Notes |
|---|---|---|---|---|---|
| Ch.1 Punnami Lane | high (first second) | 23–33 | 115 | 0.90 | shadow pass |
| Ch.1 Punnami Lane | low | 52 | 72 | 0.55 | no shadows/glow |
| Ch.3 Workshop | high (first second) | 21–24 | 133 | 0.90 | heaviest interior |
| Ch.3 Workshop | low | 50 | 83 | 0.55 | no shadows/glow |
| Ch.5 Garva House | high (first second) | 29 | 119 | 0.80 | shadow pass |
| Ch.5 Garva House | low | 54 | 73 | 0.55 | no shadows/glow |
| Ch.8 Cannon | high (first second) | 31 | 134 | 0.80 | finale + Garva |
| Ch.8 Cannon | low | 45–52 | 70 | 0.50–0.55 | no shadows/glow |
| Ch.1 at 1280×720 | low | 45 | 72 | 0.50 | software floor |

Software rasterisation is the limiting factor; these numbers are a floor, not a
device claim. A real GPU should hold high quality; the scaler targets <48 fps
down, >57 fps up, and never auto-upgrades after a fallback.

## Manual protocol (each release)

1. Serve the production build.
2. Desktop Chrome DevTools → Rendering → Frame Rendering Stats. Fly a full
   chapter on **High**; record min/avg FPS, draw calls
   (`canvas.dataset.drawCalls`), scale (`canvas.dataset.renderScale`).
3. Repeat on **Low** from the pause menu.
4. Throttle CPU 4× and repeat — the sim is fixed-step, so game speed must not
   change.
5. Phone: mid-tier Android, 10-minute sustained play; watch thermals after
   minute 6 and the auto-fallback toast.
6. Lighthouse (mobile, throttled): LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.

## Recording

| Build | Device | Quality | Min FPS | Avg FPS | Draw calls | Scale | Notes |
|---|---|---|---|---|---|---|---|
| P4 | headless Chromium | low | 45 | 45–54 | 70–83 | 0.50–0.55 | SwiftShader |
| P4 | headless Chromium | high | 21 | 23–33 | 115–134 | 0.80–0.90 | first second |
| P4 | mid-tier Android | high/low | — | — | — | — | device run pending (debt) |
