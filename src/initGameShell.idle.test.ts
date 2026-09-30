import { initGameShell } from './initGameShell';
import { WHEN_IDLE_GLOBAL, type WhenIdleWindow } from './idle/whenIdle';
import type { GameShellLabels } from './types';

const labels = {} as GameShellLabels;
const POLL_MS = 1_000;

function mount(): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('initGameShell idle gate', () => {
  it('installs window.__gsWhenIdle and removes it on dispose', () => {
    const handle = initGameShell({ root: mount(), appName: 'Aurora', labels, install: false, crash: false });
    const win = window as WhenIdleWindow;
    expect(WHEN_IDLE_GLOBAL).toBe('__gsWhenIdle');
    expect(typeof win.__gsWhenIdle).toBe('function');
    handle.dispose();
    expect(win.__gsWhenIdle).toBeUndefined();
  });

  it('setPlaying feeds the global: a reload asked for mid-play waits for the menu', () => {
    const handle = initGameShell({ root: mount(), appName: 'Aurora', labels, install: false, crash: false });
    const reload = jest.fn();
    handle.setPlaying(true);
    (window as WhenIdleWindow).__gsWhenIdle?.(reload);
    expect(reload).not.toHaveBeenCalled();
    handle.setPlaying(false);
    expect(reload).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it('the handle exposes whenIdle, which runs at once outside play', () => {
    const handle = initGameShell({ root: mount(), appName: 'Aurora', labels, install: false, crash: false });
    const fn = jest.fn();
    handle.whenIdle(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it('routes version.onNewVersion through the idle gate', async () => {
    jest.useFakeTimers();
    const bodies = ['v1', 'v2'];
    Object.assign(window, {
      fetch: jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(bodies.shift() ?? 'v2') })),
    });
    const onNewVersion = jest.fn();
    const handle = initGameShell({
      root: mount(), appName: 'Aurora', labels, install: false, crash: false,
      version: { url: '/version.txt', intervalMs: POLL_MS, onNewVersion },
    });
    handle.setPlaying(true);
    await jest.advanceTimersByTimeAsync(POLL_MS);
    expect(onNewVersion).not.toHaveBeenCalled();
    handle.setPlaying(false);
    expect(onNewVersion).toHaveBeenCalledTimes(1);
    handle.dispose();
    Reflect.deleteProperty(window, 'fetch');
  });
});
