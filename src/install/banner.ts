import { button, el, iconSpan } from '../dom';
import { ICONS } from '../icons';
import type { InstallLabels } from '../types';
import { BannerLayout } from './BannerLayout';
import { InstallVariant } from './InstallVariant';

export const STEPS_ID = 'gs-install-steps';

export interface BannerProps {
  doc: Document;
  layout: BannerLayout;
  variant: InstallVariant;
  appName: string;
  labels: InstallLabels;
  onInstall(): void;
  onDismiss(): void;
}

function renderSteps(p: BannerProps): HTMLOListElement {
  const list = el(p.doc, 'ol', 'gs-steps');
  list.id = STEPS_ID;
  const share = el(p.doc, 'li');
  share.append(iconSpan(p.doc, ICONS.share), p.doc.createTextNode(p.labels.tapShare));
  const add = el(p.doc, 'li');
  add.append(iconSpan(p.doc, ICONS.add), p.doc.createTextNode(p.labels.tapAdd));
  list.append(share, add);
  return list;
}

function closeButton(p: BannerProps): HTMLButtonElement {
  return button(p.doc, { className: 'gs-x', ariaLabel: p.labels.notNow, icon: ICONS.close, onClick: p.onDismiss });
}

function renderChip(p: BannerProps): HTMLElement[] {
  const seal = el(p.doc, 'div', 'gs-seal');
  if (p.variant === InstallVariant.Prompt) {
    seal.append(button(p.doc, { className: 'gs-chip', text: p.labels.install, icon: ICONS.download, onClick: p.onInstall }));
    seal.append(closeButton(p));
    return [seal];
  }
  const steps = renderSteps(p);
  steps.hidden = true;
  const chip = button(p.doc, {
    className: 'gs-chip',
    text: p.labels.addToHome,
    icon: ICONS.add,
    onClick: () => {
      steps.hidden = !steps.hidden;
      chip.setAttribute('aria-expanded', String(!steps.hidden));
    },
  });
  chip.setAttribute('aria-expanded', 'false');
  chip.setAttribute('aria-controls', STEPS_ID);
  seal.append(chip, closeButton(p));
  return [seal, steps];
}

function renderCard(p: BannerProps): HTMLElement[] {
  const card = el(p.doc, 'div', 'gs-card');
  const app = el(p.doc, 'div', 'gs-app');
  app.append(el(p.doc, 'i'));
  const txt = el(p.doc, 'div', 'gs-txt');
  txt.append(el(p.doc, 'b', '', p.appName), el(p.doc, 'span', '', p.labels.installBody));
  const acts = el(p.doc, 'div', 'gs-acts');
  if (p.variant === InstallVariant.Prompt) {
    acts.append(button(p.doc, { className: 'gs-btn gs-primary', text: p.labels.install, icon: ICONS.download, onClick: p.onInstall }));
  }
  acts.append(button(p.doc, { className: 'gs-btn gs-ghost', text: p.labels.notNow, onClick: p.onDismiss }));
  card.append(closeButton(p), app, txt);
  if (p.variant === InstallVariant.Ios) {
    card.append(renderSteps(p));
  }
  card.append(acts);
  return [card];
}

export function renderBanner(p: BannerProps): HTMLElement {
  const wrap = el(p.doc, 'div', 'gs gs-install');
  wrap.dataset.layout = p.layout;
  wrap.dataset.variant = p.variant;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', p.variant === InstallVariant.Prompt ? p.labels.install : p.labels.addToHome);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      p.onDismiss();
    }
  });
  wrap.append(...(p.layout === BannerLayout.Card ? renderCard(p) : renderChip(p)));
  return wrap;
}
