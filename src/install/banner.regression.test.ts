import { renderBanner } from './banner';
import { BannerLayout } from './BannerLayout';
import { InstallVariant } from './InstallVariant';
import type { InstallLabels } from '../types';

const labels: InstallLabels = {
  install: 'Install',
  addToHome: 'Add to Home Screen',
  notNow: 'Not now',
  close: 'Close',
  tapShare: 'Tap Share',
  tapAdd: 'Tap Add to Home Screen',
  installBody: 'Play offline and full screen.',
};

const accessibleName = (b: HTMLButtonElement): string => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim();

function render(layout: BannerLayout, onDismiss: () => void = jest.fn()): HTMLElement {
  const node = renderBanner({ doc: document, layout, variant: InstallVariant.Ios, appName: 'Aurora', labels, onInstall: jest.fn(), onDismiss });
  document.body.append(node);
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('banner regression', () => {
  it('Escape dismisses without reaching a keydown listener outside the banner', () => {
    const onDismiss = jest.fn();
    const outer = jest.fn();
    const node = render(BannerLayout.Chip, onDismiss);
    document.addEventListener('keydown', outer);
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', outer);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('the desktop card names only one control Not now when a close label is given', () => {
    const node = render(BannerLayout.Card);
    const names = Array.from(node.querySelectorAll('button')).map(accessibleName);
    expect(names.filter((n) => n === labels.notNow)).toHaveLength(1);
    expect(names).toContain(labels.close);
  });
});
