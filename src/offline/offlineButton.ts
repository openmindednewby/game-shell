import { el, iconSpan } from '../dom';
import { ICONS } from '../icons';
import { fillTemplate } from '../share/template';
import { injectStyles } from '../styles';
import type { Disposable } from '../types';
import { downloadForOffline, isAvailableOffline, isOfflineSupported } from './offline';
import type { OfflineOptions, OfflineProgress } from './offline';

const PERCENT = 100;

export interface OfflineButtonLabels {
  download: string;
  progress: string;
  available: string;
  failed: string;
}

export interface OfflineButtonOptions extends OfflineOptions {
  parent: HTMLElement;
  urls: readonly string[];
  labels: OfflineButtonLabels;
  doc?: Document;
  onDone?(): void;
}

export const OFFLINE_STATE = {
  Idle: 'idle',
  Working: 'working',
  Done: 'done',
  Failed: 'failed',
} as const;

export type OfflineState = (typeof OFFLINE_STATE)[keyof typeof OFFLINE_STATE];

interface OfflineView {
  root: HTMLElement;
  btn: HTMLButtonElement;
  show(state: OfflineState, text: string, ratio?: number): void;
}

function renderOffline(doc: Document): OfflineView {
  const root = el(doc, 'div', 'gs gs-offline');
  const btn = el(doc, 'button', 'gs-btn gs-ghost');
  btn.type = 'button';
  const icon = el(doc, 'span', 'gs-ico');
  const label = el(doc, 'span', 'gs-offline-label');
  const bar = el(doc, 'span', 'gs-bar');
  const fill = el(doc, 'i');
  bar.append(fill);
  btn.append(icon, label, bar);
  root.append(btn);
  const show = (state: OfflineState, text: string, ratio = 0): void => {
    root.dataset.state = state;
    icon.replaceChildren(iconSpan(doc, state === OFFLINE_STATE.Done ? ICONS.check : ICONS.download));
    label.textContent = text;
    fill.style.width = `${Math.round(ratio * PERCENT)}%`;
    btn.disabled = state === OFFLINE_STATE.Working || state === OFFLINE_STATE.Done;
    btn.setAttribute('aria-busy', String(state === OFFLINE_STATE.Working));
  };
  return { root, btn, show };
}

export function mountOfflineButton(o: OfflineButtonOptions): Disposable {
  if (!isOfflineSupported(o)) {
    return { dispose(): void {} };
  }
  const doc = o.doc ?? document;
  injectStyles(doc);
  let live = true;
  const view = renderOffline(doc);
  const show = (state: OfflineState, text: string, ratio = 0): void => {
    if (live) {
      view.show(state, text, ratio);
    }
  };
  const progress = (p: OfflineProgress): void => {
    const ratio = p.total === 0 ? 0 : p.done / p.total;
    show(OFFLINE_STATE.Working, fillTemplate(o.labels.progress, { done: p.done, total: p.total }), ratio);
  };
  const done = (): void => {
    show(OFFLINE_STATE.Done, o.labels.available, 1);
  };

  view.btn.addEventListener('click', () => {
    progress({ done: 0, total: new Set(o.urls).size });
    downloadForOffline(o.urls, progress, o)
      .then(() => {
        done();
        o.onDone?.();
      })
      .catch(() => show(OFFLINE_STATE.Failed, o.labels.failed));
  });

  show(OFFLINE_STATE.Idle, o.labels.download);
  o.parent.append(view.root);
  isAvailableOffline(o.urls, o)
    .then((available) => {
      if (available && view.root.dataset.state === OFFLINE_STATE.Idle) {
        done();
      }
    })
    .catch(() => undefined);

  return {
    dispose(): void {
      live = false;
      view.root.remove();
    },
  };
}
