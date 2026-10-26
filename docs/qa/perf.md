# Performance protocol — Egara 3D

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G. Draw calls in the low hundreds; no
per-frame allocation in sim or particle pools.

## Automated gate (every build)

```sh
npm run build   # three.js chunk ~130 KB gzip; game code < 20 KB
npm test        # sim determinism suite
```

## Manual protocol (each release)

1. Serve the production build.
2. Desktop Chrome DevTools → Rendering → Frame Rendering Stats + FPS meter.
   Fly a full 90 s run; record min/avg FPS and draw calls (HUD shows fps;
   `stage.fpsDrawCalls` in console).
3. Throttle CPU 4× and repeat — sim is fixed-step so game speed must not change.
4. Phone: mid-tier Android, 10-minute sustained play; watch thermals after
   minute 6.
5. Lighthouse (mobile, throttled): LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.

## Recording

| Build | Device | CPU | Min FPS | Avg FPS | Draw calls | Notes |
|---|---|---|---|---|---|---|
| P0 | headless Chromium (SwiftShader) | — | 46 | 60 | — | software GL; real signal needs device run |
