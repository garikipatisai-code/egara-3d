# Egara 3D — Control & Perch (P5)

Date: 2026-10-26 · Status: approved by owner direction (“better control on fly”,
“rest on things”, “pause in air instead of flying continuously”; standing
blanket authorization). Parent: story complete; P4 feel/visual gate closed.

## 1. Goal

Make the fly controllable like a small hovering creature, not a missile.

- **No automatic forward motion.** With no throttle the fly decelerates to a
  stable hover. It can stop anywhere, turn, look, and rest.
- **Throttle + turn + vertical:** W/S forward/back, A/D turn, Q/E down/up.
- **Perch:** F (keyboard) or Perch (touch) settles the fly on the ground, a
  rooftop, a desk, a safe, or another solid top when close enough; F or any
  movement input takes off again.
- **Feedback:** clear HUD text, a perch toast, slower wingbeats while perched,
  and read-only telemetry for tests.

## 2. Non-goals

- No 6DOF/strafe flight, no mouse-steer/turret mode, no physics engine.
- No autopilot, no waypoint following, no new chapters.
- No perching on arbitrary decor meshes without a sim collider (tops only).
- No change to story goals, saves, or quality presets.

## 3. Alternatives considered

| Option | Verdict |
|---|---|
| Keep auto-forward; add a brake key/toggle | Rejected: still fights the player between inputs. |
| Drone-style camera-relative WASD + mouse steer | Rejected: requires a control rewrite and loses the chase-camera feel. |
| Full 6DOF with pitch/roll/yaw | Rejected: unreadable on touch, breaks tuning. |
| **Throttle + turn + vertical, auto-hover at zero throttle (chosen)** | Fewest changes, intuitive, works with the existing chase camera. |
| Perch anywhere near geometry | Rejected in P5: needs deck/prop colliders; tops + ground first. |
| **Perch on ground/roof/solid tops with F (chosen)** | Reads clearly and is testable. |

## 4. Controls

| Action | Keyboard | Touch |
|---|---|---|
| Forward / reverse throttle | W/S or Up/Down | left stick vertical |
| Turn | A/D or Left/Right | left stick horizontal |
| Down / up | Q/E | Down/Up buttons |
| Boost | Shift | Boost button |
| Sting / sabotage | Space | Sting button |
| Perch / take off | F | Perch button |
| Look | mouse drag | right-half drag |
| Pause | P/Esc | Pause |

Zero throttle = hover; no need for a separate hover toggle.

## 5. Sim model

- `FlyInput` gains `throttle` and `perch` (both optional for old tests).
- `Player` gains `perched`, `perchNormal` and `perchSurface`.
- Speed target = `throttle * (base + boost)`; reverse is 55% speed. Drag decays
  to zero. No automatic base speed.
- Vertical target = `climb * liftSpeed`; forward uses the existing yaw/pitch
  vector. Zero throttle + zero climb = stable hover.
- Turn smoothing and bank remain; bank scales with absolute speed so a hover
  turns flat.
- Perch: find the nearest ground/roof top within 2.5 units; snap to the surface,
  zero velocity, keep yaw. Any perch press or movement input detaches with a
  small lift. Only upward-facing surfaces (normal.y > 0.5).
- Bumps/collision remain; perch is skipped while invulnerable? No, any time.
- Determinism: perch state is part of the hash.

## 6. Requirements

| ID | Requirement |
|---|---|
| C1 | Releasing throttle brings speed to zero within ~0.6 s; position is stable. |
| C2 | W/S move forward/back; Q/E move down/up; A/D turn; no automatic forward. |
| C3 | F perches on ground or a solid top within range; F/movement detaches. |
| C4 | Perch snaps without penetration; camera stays stable. |
| C5 | HUD text and touch controls expose throttle, vertical, perch. |
| C6 | Touch stick vertical = throttle; Up/Down/Perch buttons work. |
| C7 | Story objectives remain reachable; all chapters still completable. |
| C8 | Unit tests for hover/throttle/vertical/perch; e2e for controls + perch telemetry. |
| C9 | 60 fps target preserved; no new dependency; static hosting. |

## 7. Lean check

| Part | Rung | Why |
|---|---|---|
| Throttle/hover | 6 | change target speed/lift in the existing fixed step |
| Perch | 6 | nearest-top query over existing solids; no new physics |
| Input | 3 | remap keyboard, extend pointer handlers |
| Touch buttons | 3 | five DOM buttons, no library |
| Feedback | 3 | toast + wing rate + HUD copy |
| Tests | 3 | pure sim state; read-only canvas telemetry |

## 8. Decisions

1. Throttle+turn+vertical, not camera-relative strafe.
2. Zero throttle auto-hovers; no toggle.
3. Perch tops/ground only in P5; wall perching later.
4. Keyboard F / touch Perch; any movement detaches.
5. Existing chapter goals and camera stay.

## 9. Open questions

- Whether reverse throttle is useful to players or should be removed after playtest.
- Whether perch should auto-snap when very close, in addition to F.
- Whether wall perching is worth the orientation complexity in P6.
