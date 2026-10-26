import type { FlyInput } from '../sim3d/flight';

/** Keyboard input. Touch/gamepad arrive in a later phase. */
export class InputMap {
  private readonly down = new Set<string>();
  private pausePressed = false;
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
    };
    target.addEventListener('keydown', onDown);
    target.addEventListener('keyup', onUp);
    target.addEventListener('blur', onBlur);
    this.detach = [
      () => target.removeEventListener('keydown', onDown),
      () => target.removeEventListener('keyup', onUp),
      () => target.removeEventListener('blur', onBlur)
    ];
  }

  detachAll(): void {
    for (const off of this.detach) off();
    this.detach = [];
  }

  poll(): FlyInput {
    const key = (code: string) => this.down.has(code);
    return {
      turn: (key('ArrowRight') || key('KeyD') ? 1 : 0) - (key('ArrowLeft') || key('KeyA') ? 1 : 0),
      climb: (key('ArrowUp') || key('KeyW') ? 1 : 0) - (key('ArrowDown') || key('KeyS') ? 1 : 0),
      boost: key('ShiftLeft') || key('ShiftRight'),
      sting: key('Space') || key('KeyJ')
    };
  }

  consumePause(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }
}
