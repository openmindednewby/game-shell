import { button, el } from '../dom';
import { ICONS } from '../icons';
import type { CrashLabels } from '../types';

const CRASH_TITLE_ID = 'gs-crash-title';
const CRASH_BODY_ID = 'gs-crash-body';

interface CrashOverlayProps {
  doc: Document;
  labels: CrashLabels;
  reference?: string;
  onReload(): void;
  onCopy(): void;
}

interface CrashOverlayView {
  root: HTMLElement;
  reload: HTMLButtonElement;
}

export function renderCrashOverlay(p: CrashOverlayProps): CrashOverlayView {
  const root = el(p.doc, 'div', 'gs gs-crash');
  root.setAttribute('role', 'alertdialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', CRASH_TITLE_ID);
  root.setAttribute('aria-describedby', CRASH_BODY_ID);
  const panel = el(p.doc, 'div', 'gs-panel');
  const title = el(p.doc, 'h2', 'gs-h', p.labels.crashTitle);
  title.id = CRASH_TITLE_ID;
  const body = el(p.doc, 'p', '', p.labels.crashBody);
  body.id = CRASH_BODY_ID;
  const acts = el(p.doc, 'div', 'gs-acts');
  const reload = button(p.doc, { className: 'gs-btn gs-primary', text: p.labels.reload, icon: ICONS.reload, onClick: p.onReload });
  acts.append(reload, button(p.doc, { className: 'gs-btn gs-ghost', text: p.labels.copyDetails, onClick: p.onCopy }));
  panel.append(title, body, acts);
  if (p.reference !== undefined && p.reference !== '') {
    panel.append(el(p.doc, 'p', 'gs-ref', `${p.labels.errorReported} ${p.reference}`));
  }
  root.append(panel);
  return { root, reload };
}
