import type { Disposable } from '../types';

export const GS_RESIZE_EVENT = 'gs:resize';
export const GS_VH_VAR = '--gs-vh';

export interface GsResizeDetail {
  width: number;
  height: number;
}

function measure(win: Window): GsResizeDetail {
  const vv = win.visualViewport;
  if (vv) {
    return { width: vv.width, height: vv.height };
  }
  return { width: win.innerWidth, height: win.innerHeight };
}

function scheduler(win: Window): (cb: () => void) => void {
  if (typeof win.requestAnimationFrame === 'function') {
    return (cb) => {
      win.requestAnimationFrame(() => cb());
    };
  }
  return (cb) => {
    win.setTimeout(cb, 0);
  };
}

export function startFit(win: Window = window): Disposable {
  const root = win.document.documentElement;
  const schedule = scheduler(win);
  let last = measure(win);
  let pending = false;
  let disposed = false;
  root.style.setProperty(GS_VH_VAR, `${last.height}px`);

  const apply = (): void => {
    pending = false;
    const next = measure(win);
    const unchanged = next.width === last.width && next.height === last.height;
    if (disposed || unchanged) {
      return;
    }
    last = next;
    root.style.setProperty(GS_VH_VAR, `${next.height}px`);
    win.dispatchEvent(new CustomEvent<GsResizeDetail>(GS_RESIZE_EVENT, { detail: next }));
  };
  const onChange = (): void => {
    if (pending) {
      return;
    }
    pending = true;
    schedule(apply);
  };

  const vv = win.visualViewport;
  vv?.addEventListener('resize', onChange);
  win.addEventListener('resize', onChange);
  win.addEventListener('orientationchange', onChange);
  return {
    dispose: (): void => {
      disposed = true;
      root.style.removeProperty(GS_VH_VAR);
      vv?.removeEventListener('resize', onChange);
      win.removeEventListener('resize', onChange);
      win.removeEventListener('orientationchange', onChange);
    },
  };
}
