import { button, el } from '../dom';
import { ICONS } from '../icons';
import { injectStyles } from '../styles';
import type { Disposable } from '../types';
import { qrSvg } from './qr';
import { canWebShare, copyLink, shareLink } from './shareLink';
import type { ShareData, ShareNavigator } from './shareLink';
import { SHARE_OUTCOME } from './shareOutcome';
import type { ShareOutcome } from './shareOutcome';
import { DEFAULT_TOAST_MS, showToast } from './toast';

const SHARE_TITLE_ID = 'gs-share-title';

export interface ShareSheetLabels {
  title: string;
  share: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  close: string;
  qr: string;
}

export interface ShareSheetOptions extends ShareData {
  labels: ShareSheetLabels;
  doc?: Document;
  nav?: ShareNavigator;
  toastMs?: number;
  onOutcome?(outcome: ShareOutcome): void;
  onClose?(): void;
}

function renderQr(doc: Document, url: string, label: string): HTMLElement | null {
  try {
    const box = el(doc, 'div', 'gs-qr');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', label);
    box.innerHTML = qrSvg(url);
    return box;
  } catch {
    return null;
  }
}

function toastText(outcome: ShareOutcome, labels: ShareSheetLabels): string {
  if (outcome === SHARE_OUTCOME.Copied) {
    return labels.copied;
  }
  return outcome === SHARE_OUTCOME.Failed ? labels.copyFailed : '';
}

function renderActions(o: ShareSheetOptions, data: ShareData, nav: ShareNavigator, announce: (r: ShareOutcome) => void): HTMLElement {
  const doc = o.doc ?? document;
  const acts = el(doc, 'div', 'gs-acts');
  const webShare = canWebShare(data, nav);
  if (webShare) {
    acts.append(button(doc, { className: 'gs-btn gs-primary', text: o.labels.share, icon: ICONS.share, onClick: () => void shareLink(data, nav).then(announce) }));
  }
  const copyClass = webShare ? 'gs-btn gs-ghost' : 'gs-btn gs-primary';
  acts.append(button(doc, { className: copyClass, text: o.labels.copyLink, icon: ICONS.link, onClick: () => void copyLink(data, nav).then(announce) }));
  return acts;
}

function renderBody(o: ShareSheetOptions, acts: HTMLElement): HTMLElement {
  const doc = o.doc ?? document;
  const body = el(doc, 'div', 'gs-share-body');
  const qr = renderQr(doc, o.url, o.labels.qr);
  if (qr !== null) {
    body.append(qr);
  }
  const info = el(doc, 'div', 'gs-share-info');
  if (o.text !== undefined && o.text !== '') {
    info.append(el(doc, 'p', 'gs-share-text', o.text));
  }
  info.append(el(doc, 'p', 'gs-url', o.url), acts);
  body.append(info);
  return body;
}

export function openShareSheet(o: ShareSheetOptions): Disposable {
  const doc = o.doc ?? document;
  const nav = o.nav ?? (navigator as unknown as ShareNavigator);
  const data: ShareData = { url: o.url, title: o.title, text: o.text };
  const previous = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  let toast: Disposable | null = null;
  let open = true;
  injectStyles(doc);

  const announce = (outcome: ShareOutcome): void => {
    o.onOutcome?.(outcome);
    const text = toastText(outcome, o.labels);
    if (text !== '' && open) {
      toast?.dispose();
      toast = showToast(text, o.toastMs ?? DEFAULT_TOAST_MS, doc);
    }
  };
  const close = (): void => handle.dispose();
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      close();
    }
  };

  const root = el(doc, 'div', 'gs gs-share');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', SHARE_TITLE_ID);
  const sheet = el(doc, 'div', 'gs-sheet');
  const head = el(doc, 'div', 'gs-sheet-head');
  const title = el(doc, 'h2', 'gs-h', o.labels.title);
  title.id = SHARE_TITLE_ID;
  head.append(title, button(doc, { className: 'gs-x', ariaLabel: o.labels.close, icon: ICONS.close, onClick: close }));
  const acts = renderActions(o, data, nav, announce);
  sheet.append(head, renderBody(o, acts));
  root.append(sheet);
  root.addEventListener('click', (e) => {
    if (e.target === root) {
      close();
    }
  });
  doc.addEventListener('keydown', onKey);
  doc.body.append(root);
  acts.querySelector('button')?.focus();

  const handle: Disposable = {
    dispose(): void {
      if (!open) {
        return;
      }
      open = false;
      doc.removeEventListener('keydown', onKey);
      root.remove();
      previous?.focus();
      o.onClose?.();
    },
  };
  return handle;
}
