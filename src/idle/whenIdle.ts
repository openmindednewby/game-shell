import type { Disposable } from '../types';

export const DEFAULT_IDLE_MAX_WAIT_MS = 30 * 60 * 1000;
export const WHEN_IDLE_GLOBAL = '__gsWhenIdle';

export type WhenIdle = (fn: () => void) => void;
export type WhenIdleWindow = Window & { [WHEN_IDLE_GLOBAL]?: WhenIdle };

export interface IdleGateOptions {
  win: Window;
  maxWaitMs?: number;
}

export interface IdleGate extends Disposable {
  whenIdle: WhenIdle;
  setPlaying(playing: boolean): void;
}

export function startIdleGate(opts: IdleGateOptions): IdleGate {
  const { win } = opts;
  const doc = win.document;
  const maxWaitMs = opts.maxWaitMs ?? DEFAULT_IDLE_MAX_WAIT_MS;
  let playing = false;
  let used = false;
  let pending: (() => void) | null = null;
  let timer = 0;

  const clear = (): void => {
    win.clearTimeout(timer);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
  const flush = (): void => {
    const fn = pending;
    pending = null;
    clear();
    fn?.();
  };
  function onVisibility(): void {
    if (doc.visibilityState === 'hidden') {
      flush();
    }
  }
  const onMaxWait = (): void => {
    if (doc.visibilityState === 'hidden') {
      flush();
      return;
    }
    doc.addEventListener('visibilitychange', onVisibility);
  };

  const whenIdle = (fn: () => void): void => {
    if (used) {
      return;
    }
    used = true;
    if (!playing) {
      fn();
      return;
    }
    pending = fn;
    timer = win.setTimeout(onMaxWait, maxWaitMs);
  };
  const setPlaying = (next: boolean): void => {
    playing = next;
    if (!next && pending) {
      flush();
    }
  };
  return {
    whenIdle,
    setPlaying,
    dispose: (): void => {
      pending = null;
      clear();
    },
  };
}
