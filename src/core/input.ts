import type { FlyInput } from '../sim3d/flight';

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export interface TouchTargets {
  canvas: HTMLCanvasElement;
  stick: HTMLElement;
  cap: HTMLElement;
  sting: HTMLButtonElement;
  boost: HTMLButtonElement;
  onLook: (dx: number, dy: number) => void;
}

/** Keyboard + mouse look + touch stick. */
export class InputMap {
  private readonly down = new Set<string>();
  private pausePressed = false;
  private touchTurn = 0;
  private touchClimb = 0;
  private touchBoost = false;
  private touchSting = false;
  private detach: (() => void)[] = [];

  attach(target: Window): void {
    const onDown = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (event.repeat) return;
      this.down.add(event.code);
      if (event.code === 'KeyP' || event.code === 'Escape') this.pausePressed = true;
    };
    const onUp = (event: KeyboardEvent) => this.down.delete(event.code);
    const onBlur = () => {
      this.down.clear();
      this.pausePressed = true;
      this.resetTouch();
    };
    target.addEventListener('keydown', onDown);
    target.addEventListener('keyup', onUp);
    target.addEventListener('blur', onBlur);
    this.detach.push(
      () => target.removeEventListener('keydown', onDown),
      () => target.removeEventListener('keyup', onUp),
      () => target.removeEventListener('blur', onBlur)
    );
  }

  attachTouch(targets: TouchTargets): void {
    let stickId: number | null = null;
    let lookId: number | null = null;
    let originX = 0;
    let originY = 0;
    let lookX = 0;
    let lookY = 0;

    const showStick = (x: number, y: number) => {
      targets.stick.style.left = `${x}px`;
      targets.stick.style.top = `${y}px`;
      targets.stick.classList.add('is-active');
      targets.cap.style.transform = 'translate(-50%, -50%)';
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      event.preventDefault();
      try {
        targets.canvas.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic events in tests have no active pointer to capture.
      }
      if (event.clientX < window.innerWidth / 2) {
        stickId = event.pointerId;
        originX = event.clientX;
        originY = event.clientY;
        showStick(originX, originY);
      } else {
        lookId = event.pointerId;
        lookX = event.clientX;
        lookY = event.clientY;
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      if (event.pointerId === stickId) {
        const dx = event.clientX - originX;
        const dy = event.clientY - originY;
        const radius = 42;
        const length = Math.hypot(dx, dy) || 1;
        const scale = Math.min(1, radius / length);
        const cappedX = dx * scale;
        const cappedY = dy * scale;
        targets.cap.style.transform = `translate(calc(-50% + ${cappedX}px), calc(-50% + ${cappedY}px))`;
        this.touchTurn = clamp(cappedX / radius, -1, 1);
        this.touchClimb = clamp(-cappedY / radius, -1, 1);
      } else if (event.pointerId === lookId) {
        targets.onLook(event.clientX - lookX, event.clientY - lookY);
        lookX = event.clientX;
        lookY = event.clientY;
      }
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId === stickId) {
        stickId = null;
        targets.stick.classList.remove('is-active');
        this.touchTurn = 0;
        this.touchClimb = 0;
      }
      if (event.pointerId === lookId) lookId = null;
    };

    const onStingDown = (event: PointerEvent) => {
      event.preventDefault();
      this.touchSting = true;
    };
    const onStingUp = () => {
      this.touchSting = false;
    };
    const onBoostDown = (event: PointerEvent) => {
      event.preventDefault();
      this.touchBoost = true;
    };
    const onBoostUp = () => {
      this.touchBoost = false;
    };

    targets.canvas.addEventListener('pointerdown', onDown);
    targets.canvas.addEventListener('pointermove', onMove);
    targets.canvas.addEventListener('pointerup', onUp);
    targets.canvas.addEventListener('pointercancel', onUp);
    targets.sting.addEventListener('pointerdown', onStingDown);
    targets.sting.addEventListener('pointerup', onStingUp);
    targets.sting.addEventListener('pointercancel', onStingUp);
    targets.sting.addEventListener('pointerleave', onStingUp);
    targets.boost.addEventListener('pointerdown', onBoostDown);
    targets.boost.addEventListener('pointerup', onBoostUp);
    targets.boost.addEventListener('pointercancel', onBoostUp);
    targets.boost.addEventListener('pointerleave', onBoostUp);

    this.detach.push(
      () => targets.canvas.removeEventListener('pointerdown', onDown),
      () => targets.canvas.removeEventListener('pointermove', onMove),
      () => targets.canvas.removeEventListener('pointerup', onUp),
      () => targets.canvas.removeEventListener('pointercancel', onUp),
      () => targets.sting.removeEventListener('pointerdown', onStingDown),
      () => targets.sting.removeEventListener('pointerup', onStingUp),
      () => targets.sting.removeEventListener('pointercancel', onStingUp),
      () => targets.sting.removeEventListener('pointerleave', onStingUp),
      () => targets.boost.removeEventListener('pointerdown', onBoostDown),
      () => targets.boost.removeEventListener('pointerup', onBoostUp),
      () => targets.boost.removeEventListener('pointercancel', onBoostUp),
      () => targets.boost.removeEventListener('pointerleave', onBoostUp)
    );
  }

  private resetTouch(): void {
    this.touchTurn = 0;
    this.touchClimb = 0;
    this.touchBoost = false;
    this.touchSting = false;
  }

  detachAll(): void {
    for (const off of this.detach) off();
    this.detach = [];
  }

  poll(): FlyInput {
    const key = (code: string) => this.down.has(code);
    const keyboardTurn = (key('ArrowRight') || key('KeyD') ? 1 : 0) - (key('ArrowLeft') || key('KeyA') ? 1 : 0);
    const keyboardClimb = (key('ArrowUp') || key('KeyW') ? 1 : 0) - (key('ArrowDown') || key('KeyS') ? 1 : 0);
    return {
      turn: clamp(keyboardTurn + this.touchTurn, -1, 1),
      climb: clamp(keyboardClimb + this.touchClimb, -1, 1),
      boost: key('ShiftLeft') || key('ShiftRight') || this.touchBoost,
      sting: key('Space') || key('KeyJ') || this.touchSting
    };
  }

  consumePause(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }
}
