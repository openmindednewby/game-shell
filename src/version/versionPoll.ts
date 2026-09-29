import type { Disposable } from '../types';

export interface VersionPollOptions {
  url: string;
  intervalMs: number;
  onNewVersion(): void;
  fetchFn?: typeof fetch;
  win?: Window;
}

export function startVersionPoll(opts: VersionPollOptions): Disposable {
  const win = opts.win ?? window;
  const fetchFn = opts.fetchFn ?? ((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => win.fetch(input, init));
  let baseline: string | null = null;
  let fired = false;
  let busy = false;
  let disposed = false;
  let timer = 0;
  const stop = (): void => {
    win.clearInterval(timer);
    win.document.removeEventListener('visibilitychange', onVisibility);
  };

  const check = async (): Promise<void> => {
    if (fired || busy || disposed) {
      return;
    }
    busy = true;
    try {
      const res = await fetchFn(opts.url, { cache: 'no-store' });
      if (!res.ok || disposed) {
        return;
      }
      const value = (await res.text()).trim();
      if (disposed) {
        return;
      }
      if (baseline === null) {
        baseline = value;
      } else if (value !== baseline) {
        fired = true;
        stop();
        opts.onNewVersion();
      }
    } catch {
      // Offline or a deploy mid-flight: the next tick tries again.
    } finally {
      busy = false;
    }
  };
  function onVisibility(): void {
    if (win.document.visibilityState === 'visible') {
      void check();
    }
  }

  void check();
  timer = win.setInterval(() => void check(), opts.intervalMs);
  win.document.addEventListener('visibilitychange', onVisibility);
  return {
    dispose: (): void => {
      disposed = true;
      stop();
    },
  };
}
