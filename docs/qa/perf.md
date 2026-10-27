# Performance protocol — Egara 3D

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G. High quality is GPU-targeted: PBR + PMREM
environment + 2048 shadows + bloom/grade. Low quality swaps to Lambert, removes
post/shadows, and reduces detail. Adaptive render scale 0.50–1.0.

## Automated gate (P6)

```sh
npx vitest run tests/unit       # 81 tests
npx tsc --noEmit                # clean
npm run build                   # 736 KB raw / 194 KB gzip total
npx playwright test tests/smoke # 15 passed, 1 skipped (live)
```

Bundle split: three.js + post addons ~135 KB gzip; game code ~59 KB gzip.
Automated browsers default to low so shader compilation cannot time tests out.
Force a tier with `?quality=high` or `?quality=low`.

## Headless run — Chromium SwiftShader, 960×540

High samples are forced and taken in the first second; software rasterisation is
the limiting factor. Low samples are settled after the tier swap.

| Scene | Mode | FPS | Draw calls | Scale |
|---|---|---|---|---|
| Ch.1 Punnami Lane | high | 4 | 225 | 0.65 |
| Ch.1 Punnami Lane | low | 54–56 | 152 | 0.50 |
| Ch.3 Workshop | high | 8 | 221 | 0.65 |
| Ch.3 Workshop | low | 54–60 | 125 | 0.60 |
| Ch.4 Airport Road | high | 11–13 | 242 | 0.65 |
| Ch.4 Airport Road | low | 56–58 | 204 | 1.00 |
| Ch.5 Garva House | high | 9 | 181 | 0.65 |
| Ch.5 Garva House | low | 56 | 139 | 0.65 |
| Ch.8 Cannon | high | 8 | 250 | 0.65 |
| Ch.8 Cannon | low | 54–60 | 189 | 0.50 |

High is a real-GPU tier; the headless numbers are a floor, not a device claim.
Low is the safe mode and auto-falls back under 50 fps. Draw-call budgets were
raised by the density pass (high ≤260, low ≤210) and are recorded as debt for
future batching.

## Manual protocol (each release)

1. Serve the production build.
2. Desktop Chrome DevTools → Rendering → Frame Rendering Stats. Fly a full
   chapter on **High**; record min/avg FPS, draw calls
   (`canvas.dataset.drawCalls`), scale (`canvas.dataset.renderScale`).
3. Repeat on **Low** from the pause menu; check the auto-fallback toast.
4. Throttle CPU 4× and repeat — the sim is fixed-step, so game speed must not
   change.
5. Phone: mid-tier Android, 10-minute sustained play; watch thermals after
   minute 6 and the quality floor.
6. Lighthouse (mobile, throttled): LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.

## Recording

| Build | Device | Quality | Min FPS | Avg FPS | Draw calls | Scale | Notes |
|---|---|---|---|---|---|---|---|
| P6 | headless Chromium | low | 54 | 54–60 | 125–204 | 0.50–1.00 | SwiftShader |
| P6 | headless Chromium | high | 4 | 4–13 | 181–250 | 0.65 | first second |
| P6 | mid-tier Android | high/low | — | — | — | — | device run pending (debt) |
