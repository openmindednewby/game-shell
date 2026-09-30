import { DEFAULT_IDLE_MAX_WAIT_MS, startIdleGate } from './whenIdle';

const MAX_WAIT_MS = 1_000;

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('startIdleGate', () => {
  it('defaults the maximum wait to 30 minutes', () => {
    expect(DEFAULT_IDLE_MAX_WAIT_MS).toBe(30 * 60 * 1000);
  });

  it('runs the callback at once when the player is not playing', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    const fn = jest.fn();
    gate.whenIdle(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('holds the callback during play and runs it on the next setPlaying(false)', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    expect(fn).not.toHaveBeenCalled();
    gate.setPlaying(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not run on a tab hide before the maximum wait has passed', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    setVisibility('hidden');
    expect(fn).not.toHaveBeenCalled();
  });

  it('after the maximum wait, runs on the next hide of a visible tab', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    jest.advanceTimersByTime(MAX_WAIT_MS);
    expect(fn).not.toHaveBeenCalled();
    setVisibility('visible');
    expect(fn).not.toHaveBeenCalled();
    setVisibility('hidden');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('after the maximum wait, runs at once when the tab is already hidden', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    setVisibility('hidden');
    jest.advanceTimersByTime(MAX_WAIT_MS);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps one pending callback and drops later calls', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const first = jest.fn();
    const second = jest.fn();
    gate.whenIdle(first);
    gate.whenIdle(second);
    gate.setPlaying(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('fires once per page load: calls after the first has run are dropped', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    const first = jest.fn();
    const second = jest.fn();
    gate.whenIdle(first);
    gate.whenIdle(second);
    gate.setPlaying(true);
    gate.setPlaying(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('a pending callback runs only once even when play stops after the hide fired it', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    jest.advanceTimersByTime(MAX_WAIT_MS);
    setVisibility('hidden');
    gate.setPlaying(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('dispose during play drops the waiting callback and leaves no timer behind', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    gate.dispose();
    expect(jest.getTimerCount()).toBe(0);
    expect(fn).not.toHaveBeenCalled();
  });

  it('after dispose, whenIdle during play arms no timer and no visibility listener', () => {
    const add = jest.spyOn(document, 'addEventListener');
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.dispose();
    gate.setPlaying(true);
    const fn = jest.fn();
    gate.whenIdle(fn);
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(MAX_WAIT_MS);
    expect(add).not.toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    add.mockRestore();
  });

  it('after dispose, whenIdle and setPlaying never run a callback', () => {
    const gate = startIdleGate({ win: window, maxWaitMs: MAX_WAIT_MS });
    gate.dispose();
    const idle = jest.fn();
    gate.whenIdle(idle);
    gate.setPlaying(true);
    gate.setPlaying(false);
    setVisibility('hidden');
    expect(idle).not.toHaveBeenCalled();
  });
});
