import type { Disposable } from '../types';

export interface LifecycleOptions {
  onHidden?(): void;
  onVisible?(): void;
}

export interface ResumableAudio {
  readonly state?: string;
  resume(): Promise<void> | void;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'keydown'] as const;
const RUNNING = 'running';

export function startLifecycle(opts: LifecycleOptions, doc: Document = document): Disposable {
  const onChange = (): void => {
    if (doc.visibilityState === 'hidden') {
      opts.onHidden?.();
      return;
    }
    opts.onVisible?.();
  };
  doc.addEventListener('visibilitychange', onChange);
  return { dispose: (): void => doc.removeEventListener('visibilitychange', onChange) };
}

export function unlockAudio(ctx: ResumableAudio, win: Window = window): Disposable {
  const detach = (): void => {
    UNLOCK_EVENTS.forEach((type) => win.removeEventListener(type, onGesture, true));
  };
  const settle = (): void => {
    if (ctx.state === undefined || ctx.state === RUNNING) {
      detach();
    }
  };
  function onGesture(): void {
    if (ctx.state === RUNNING) {
      detach();
      return;
    }
    try {
      Promise.resolve(ctx.resume()).then(settle, () => undefined);
    } catch {
      // A browser that refuses resume() leaves the game silent, never crashed.
    }
  }
  UNLOCK_EVENTS.forEach((type) => win.addEventListener(type, onGesture, true));
  return { dispose: detach };
}

export function prefersReducedMotion(win: Window = window): boolean {
  if (new URLSearchParams(win.location.search).get('reducedMotion') === '1') {
    return true;
  }
  return typeof win.matchMedia === 'function' && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}
