import { DEFAULT_TOAST_MS } from '../share/toast';
import { mountPadBadge, padBadgeText } from './padBadge';
import { PAD_CHANGE } from './padChange';
import { DEFAULT_PAD_LABELS } from './padLabels';
import { MAX_PAD_NAME, shortPadName } from './padName';
import { PAD_TOAST_SLIDE_CLASS, padToastText, startPadToasts } from './padToast';
import { watchGamepads } from './padWatch';
import type { GamepadLike, PadChange, PadInfo } from './padWatch';

const XBOX_ID = 'Xbox 360 Controller (XInput STANDARD GAMEPAD)';
const DUALSENSE_ID = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)';

function padEvent(type: string, pad: GamepadLike): Event {
  return Object.assign(new Event(type), { gamepad: pad });
}

function connect(index: number, id: string): void {
  window.dispatchEvent(padEvent('gamepadconnected', { index, id, connected: true }));
}

function disconnect(index: number, id: string): void {
  window.dispatchEvent(padEvent('gamepaddisconnected', { index, id, connected: false }));
}

function exposePads(pads: ReadonlyArray<GamepadLike | null>): void {
  Object.defineProperty(window.navigator, 'getGamepads', { configurable: true, value: () => pads });
}

function info(index: number, name: string, slot: number): PadInfo {
  return { index, id: name, name, slot };
}

function setReducedMotion(on: boolean): void {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: on }) });
}

afterEach(() => {
  document.body.innerHTML = '';
  exposePads([]);
  setReducedMotion(false);
  jest.useRealTimers();
});

describe('shortPadName', () => {
  it('with a Chrome DualSense id, returns the brand', () => {
    const name = shortPadName(DUALSENSE_ID);

    expect(name).toBe('DualSense');
  });

  it('with a Firefox vendor-product prefix on an unknown pad, drops the prefix', () => {
    const name = shortPadName('1234-5678-Acme Arcade Stick');

    expect(name).toBe('Acme Arcade Stick');
  });

  it('with an unknown name longer than the cap, cuts it with an ellipsis', () => {
    const name = shortPadName('Acme Super Ultra Deluxe Arcade Fight Stick Pro (Vendor: 1234 Product: 5678)');

    expect(name.length).toBe(MAX_PAD_NAME);
    expect(name.endsWith('…')).toBe(true);
  });

  it('with an id that is only a vendor block, returns the fallback', () => {
    const name = shortPadName('(STANDARD GAMEPAD)', 'Pad');

    expect(name).toBe('Pad');
  });
});

describe('watchGamepads', () => {
  it('with a pad already exposed at start, reports it in the initial change', () => {
    exposePads([null, { index: 1, id: XBOX_ID, connected: true }]);
    const changes: PadChange[] = [];

    watchGamepads({ onChange: (c) => changes.push(c) }).dispose();

    expect(changes).toEqual([{ kind: PAD_CHANGE.Initial, pads: [{ index: 1, id: XBOX_ID, name: 'Xbox', slot: 1 }] }]);
  });

  it('with two pads connecting out of order, numbers players by pad index', () => {
    const changes: PadChange[] = [];
    const watch = watchGamepads({ onChange: (c) => changes.push(c) });
    connect(2, DUALSENSE_ID);

    connect(0, XBOX_ID);

    watch.dispose();
    expect(changes[2].pad).toEqual({ index: 0, id: XBOX_ID, name: 'Xbox', slot: 1 });
    expect(changes[2].pads.map((p) => p.slot)).toEqual([1, 2]);
  });

  it('with a disconnect, reports the slot the pad held before it left', () => {
    const changes: PadChange[] = [];
    const watch = watchGamepads({ onChange: (c) => changes.push(c) });
    connect(0, XBOX_ID);
    connect(1, DUALSENSE_ID);

    disconnect(1, DUALSENSE_ID);

    watch.dispose();
    expect(changes[3]).toEqual({
      kind: PAD_CHANGE.Disconnected,
      pad: { index: 1, id: DUALSENSE_ID, name: 'DualSense', slot: 2 },
      pads: [{ index: 0, id: XBOX_ID, name: 'Xbox', slot: 1 }],
    });
  });

  it('after dispose, ignores further pad events', () => {
    const onChange = jest.fn();
    watchGamepads({ onChange }).dispose();

    connect(0, XBOX_ID);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('padToastText', () => {
  it('with the initial snapshot, returns null', () => {
    const text = padToastText({ kind: PAD_CHANGE.Initial, pads: [info(0, 'Xbox', 1)] }, DEFAULT_PAD_LABELS);

    expect(text).toBeNull();
  });

  it('with the only pad connecting, names it without a player number', () => {
    const pad = info(0, 'Xbox', 1);

    const text = padToastText({ kind: PAD_CHANGE.Connected, pad, pads: [pad] }, DEFAULT_PAD_LABELS);

    expect(text).toBe('Controller connected: Xbox');
  });

  it('with a second pad connecting, adds its player number', () => {
    const pad = info(1, 'DualSense', 2);

    const text = padToastText({ kind: PAD_CHANGE.Connected, pad, pads: [info(0, 'Xbox', 1), pad] }, DEFAULT_PAD_LABELS);

    expect(text).toBe('P2 controller connected: DualSense');
  });

  it('with the last pad leaving, says disconnected without a player number', () => {
    const text = padToastText({ kind: PAD_CHANGE.Disconnected, pad: info(0, 'Xbox', 1), pads: [] }, DEFAULT_PAD_LABELS);

    expect(text).toBe('Controller disconnected: Xbox');
  });
});

describe('startPadToasts', () => {
  it('with a pad connecting, shows a polite sliding toast that expires', () => {
    jest.useFakeTimers();
    const toasts = startPadToasts();

    connect(0, XBOX_ID);

    const node = document.querySelector('.gs-toast');
    expect(node?.textContent).toBe('Controller connected: Xbox');
    expect(node?.getAttribute('aria-live')).toBe('polite');
    expect(node?.classList.contains(PAD_TOAST_SLIDE_CLASS)).toBe(true);
    jest.advanceTimersByTime(DEFAULT_TOAST_MS);
    expect(document.querySelector('.gs-toast')).toBeNull();
    toasts.dispose();
  });

  it('with reduced motion, shows the toast without the slide', () => {
    setReducedMotion(true);
    const toasts = startPadToasts();

    connect(0, XBOX_ID);

    expect(document.querySelector('.gs-toast')?.classList.contains(PAD_TOAST_SLIDE_CLASS)).toBe(false);
    toasts.dispose();
  });

  it('with a disconnect right after a connect, replaces the toast instead of stacking', () => {
    const toasts = startPadToasts({ labels: { disconnected: 'Pad gone: {name}' } });
    connect(0, XBOX_ID);

    disconnect(0, XBOX_ID);

    expect(Array.from(document.querySelectorAll('.gs-toast')).map((n) => n.textContent)).toEqual(['Pad gone: Xbox']);
    toasts.dispose();
  });
});

describe('padBadgeText', () => {
  it('with two pads, returns the count', () => {
    const text = padBadgeText([info(0, 'Xbox', 1), info(1, 'DualSense', 2)], DEFAULT_PAD_LABELS);

    expect(text).toBe('2 controllers connected');
  });
});

describe('mountPadBadge', () => {
  it('with no pad, mounts hidden and fixed when no parent is given', () => {
    const badge = mountPadBadge();

    const root = document.querySelector<HTMLElement>('[data-testid=pad-badge]');

    expect(root?.hidden).toBe(true);
    expect(root?.dataset.fixed).toBe('');
    badge.dispose();
  });

  it('with one pad in a parent, shows only the icon and announces the name', () => {
    const parent = document.createElement('div');
    document.body.append(parent);
    const badge = mountPadBadge({ parent });

    connect(0, XBOX_ID);

    const root = parent.querySelector<HTMLElement>('.gs-pad');
    expect(root?.hidden).toBe(false);
    expect(root?.dataset.fixed).toBeUndefined();
    expect(root?.querySelectorAll('.gs-pad-slot')).toHaveLength(0);
    expect(root?.querySelector('.gs-sr')?.textContent).toBe('Controller connected: Xbox');
    badge.dispose();
  });

  it('with two pads, shows P1 and P2 slots', () => {
    const badge = mountPadBadge();
    connect(0, XBOX_ID);

    connect(1, DUALSENSE_ID);

    const slots = Array.from(document.querySelectorAll('.gs-pad-slot')).map((n) => n.textContent);
    expect(slots).toEqual(['P1', 'P2']);
    expect(document.querySelector<HTMLElement>('.gs-pad')?.dataset.count).toBe('2');
    badge.dispose();
  });

  it('after dispose, removes the badge', () => {
    const badge = mountPadBadge();

    badge.dispose();

    expect(document.querySelector('.gs-pad')).toBeNull();
  });
});
