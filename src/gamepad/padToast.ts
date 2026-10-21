import { prefersReducedMotion } from '../lifecycle/lifecycle';
import { mountToast, DEFAULT_TOAST_MS } from '../share/toast';
import { fillTemplate } from '../share/template';
import type { Disposable } from '../types';
import { PAD_CHANGE } from './padChange';
import { DEFAULT_PAD_LABELS } from './padLabels';
import type { PadLabels } from './padLabels';
import { watchGamepads } from './padWatch';
import type { PadChange } from './padWatch';

export interface PadToastOptions {
  labels?: Partial<PadLabels>;
  ms?: number;
  doc?: Document;
  win?: Window;
}

export const PAD_TOAST_SLIDE_CLASS = 'gs-toast-slide';

/** Toast text for a pad connect or disconnect, or `null` for the start snapshot. */
export function padToastText(change: PadChange, labels: PadLabels): string | null {
  const pad = change.pad;
  if (change.kind === PAD_CHANGE.Initial || pad === undefined) {
    return null;
  }
  const connected = change.kind === PAD_CHANGE.Connected;
  const multi = connected ? change.pads.length > 1 : change.pads.length > 0;
  const single = connected ? labels.connected : labels.disconnected;
  const player = connected ? labels.playerConnected : labels.playerDisconnected;
  return fillTemplate(multi ? player : single, { name: pad.name, slot: pad.slot });
}

/** Shows a polite "Controller connected / disconnected" toast on every pad change. */
export function startPadToasts(o: PadToastOptions = {}): Disposable {
  const doc = o.doc ?? document;
  const win = o.win ?? doc.defaultView ?? window;
  const labels: PadLabels = { ...DEFAULT_PAD_LABELS, ...o.labels };
  const className = prefersReducedMotion(win) ? '' : PAD_TOAST_SLIDE_CLASS;
  let current: Disposable | null = null;
  const watch = watchGamepads({
    win,
    onChange(change: PadChange): void {
      const text = padToastText(change, labels);
      if (text === null) {
        return;
      }
      current?.dispose();
      current = mountToast(doc, text, o.ms ?? DEFAULT_TOAST_MS, className);
    },
  });
  return {
    dispose(): void {
      watch.dispose();
      current?.dispose();
    },
  };
}
