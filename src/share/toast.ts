import { el } from '../dom';
import { injectStyles } from '../styles';
import type { Disposable } from '../types';

export const DEFAULT_TOAST_MS = 2500;

export function mountToast(doc: Document, text: string, ms: number, extraClass: string): Disposable {
  injectStyles(doc);
  const node = el(doc, 'div', extraClass === '' ? 'gs gs-toast' : `gs gs-toast ${extraClass}`, text);
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  doc.body.append(node);
  const timer = setTimeout(() => node.remove(), ms);
  return {
    dispose(): void {
      clearTimeout(timer);
      node.remove();
    },
  };
}

export function showToast(text: string, ms: number = DEFAULT_TOAST_MS, doc: Document = document): Disposable {
  return mountToast(doc, text, ms, '');
}
