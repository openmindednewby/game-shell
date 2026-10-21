import { el, iconSpan } from '../dom';
import { ICONS } from '../icons';
import { fillTemplate } from '../share/template';
import { injectStyles } from '../styles';
import type { Disposable } from '../types';
import { DEFAULT_PAD_LABELS } from './padLabels';
import type { PadLabels } from './padLabels';
import { watchGamepads } from './padWatch';
import type { PadInfo } from './padWatch';

export interface PadBadgeOptions {
  parent?: HTMLElement;
  labels?: Partial<PadLabels>;
  doc?: Document;
  win?: Window;
}

/** Accessible badge text: empty with no pad, the pad name with one, the count with 2+. */
export function padBadgeText(pads: readonly PadInfo[], labels: PadLabels): string {
  if (pads.length === 0) {
    return '';
  }
  const [only] = pads;
  if (pads.length === 1 && only !== undefined) {
    return fillTemplate(labels.badgeOne, { name: only.name });
  }
  return fillTemplate(labels.badgeMany, { count: pads.length });
}

function render(root: HTMLElement, doc: Document, pads: readonly PadInfo[], labels: PadLabels): void {
  root.hidden = pads.length === 0;
  root.dataset.count = String(pads.length);
  const slots = pads.length > 1 ? pads.map((p) => el(doc, 'span', 'gs-pad-slot', fillTemplate(labels.player, { slot: p.slot }))) : [];
  slots.forEach((s) => s.setAttribute('aria-hidden', 'true'));
  root.replaceChildren(iconSpan(doc, ICONS.gamepad), ...slots, el(doc, 'span', 'gs-sr', padBadgeText(pads, labels)));
}

/** Mounts a controller badge (P1 / P2 at 2+ pads) in `parent`, or fixed bottom-left; hidden with no pad. */
export function mountPadBadge(o: PadBadgeOptions = {}): Disposable {
  const doc = o.doc ?? document;
  const win = o.win ?? doc.defaultView ?? window;
  const labels: PadLabels = { ...DEFAULT_PAD_LABELS, ...o.labels };
  injectStyles(doc);
  const root = el(doc, 'div', 'gs gs-pad');
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.dataset.testid = 'pad-badge';
  if (o.parent === undefined) {
    root.dataset.fixed = '';
  }
  (o.parent ?? doc.body).append(root);
  const watch = watchGamepads({ win, onChange: (change) => render(root, doc, change.pads, labels) });
  return {
    dispose(): void {
      watch.dispose();
      root.remove();
    },
  };
}
