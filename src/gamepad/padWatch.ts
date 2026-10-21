import type { Disposable } from '../types';
import { PAD_CHANGE } from './padChange';
import type { PadChangeKind } from './padChange';
import { shortPadName } from './padName';

export interface GamepadLike {
  index: number;
  id: string;
  connected?: boolean;
}

export interface PadInfo {
  index: number;
  id: string;
  name: string;
  slot: number;
}

export interface PadChange {
  kind: PadChangeKind;
  pad?: PadInfo;
  pads: readonly PadInfo[];
}

export interface PadWatchOptions {
  onChange(change: PadChange): void;
  win?: Window;
}

interface PadEventLike {
  gamepad?: GamepadLike;
}

interface PadNavigator {
  getGamepads?: () => ReadonlyArray<GamepadLike | null>;
}

function snapshot(win: Window): GamepadLike[] {
  const nav = win.navigator as unknown as PadNavigator;
  if (typeof nav.getGamepads !== 'function') {
    return [];
  }
  try {
    return Array.from(nav.getGamepads()).filter((p): p is GamepadLike => p !== null && p.connected !== false);
  } catch {
    return [];
  }
}

function toInfos(byIndex: ReadonlyMap<number, GamepadLike>): PadInfo[] {
  return [...byIndex.values()]
    .sort((a, b) => a.index - b.index)
    .map((p, i) => ({ index: p.index, id: p.id, name: shortPadName(p.id), slot: i + 1 }));
}

/** Tracks connected gamepads and reports each change; P1 is the lowest pad index. */
export function watchGamepads(o: PadWatchOptions): Disposable {
  const win = o.win ?? window;
  const byIndex = new Map<number, GamepadLike>();
  snapshot(win).forEach((p) => byIndex.set(p.index, p));

  const onConnect = (e: Event): void => {
    const pad = (e as PadEventLike).gamepad;
    if (pad === undefined) {
      return;
    }
    byIndex.set(pad.index, pad);
    const pads = toInfos(byIndex);
    o.onChange({ kind: PAD_CHANGE.Connected, pad: pads.find((p) => p.index === pad.index), pads });
  };
  const onDisconnect = (e: Event): void => {
    const pad = (e as PadEventLike).gamepad;
    if (pad === undefined || !byIndex.has(pad.index)) {
      return;
    }
    const gone = toInfos(byIndex).find((p) => p.index === pad.index);
    byIndex.delete(pad.index);
    o.onChange({ kind: PAD_CHANGE.Disconnected, pad: gone, pads: toInfos(byIndex) });
  };

  win.addEventListener('gamepadconnected', onConnect);
  win.addEventListener('gamepaddisconnected', onDisconnect);
  o.onChange({ kind: PAD_CHANGE.Initial, pads: toInfos(byIndex) });
  return {
    dispose(): void {
      win.removeEventListener('gamepadconnected', onConnect);
      win.removeEventListener('gamepaddisconnected', onDisconnect);
    },
  };
}
