import type { Disposable } from '../types';

export interface LifecycleOptions {
  onHidden?(): void;
  onVisible?(): void;
}

export interface ResumableAudio {
  resume(): Promise<void> | void;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const UNLOCK_EVENTS = ['pointerdown', 'keydown'] as const;

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
    UNLOCK_EVENTS.forEach((type) => win.removeEventListener(type, onFirst, true));
  };
  function onFirst(): void {
    detach();
    try {
      Promise.resolve(ctx.resume()).catch(() => undefined);
    } catch {
      // A browser that refuses resume() leaves the game silent, never crashed.
    }
  }
  UNLOCK_EVENTS.forEach((type) => win.addEventListener(type, onFirst, true));
  return { dispose: detach };
}

export function prefersReducedMotion(win: Window = window): boolean {
  if (new URLSearchParams(win.location.search).get('reducedMotion') === '1') {
    return true;
  }
  return typeof win.matchMedia === 'function' && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}
