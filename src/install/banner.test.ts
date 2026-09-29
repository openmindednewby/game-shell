import { renderBanner } from './banner';
import { BannerLayout } from './BannerLayout';
import { InstallVariant } from './InstallVariant';
import { injectStyles } from '../styles';
import type { InstallLabels } from '../types';

const MIN_TARGET_PX = 44;

const labels: InstallLabels = {
  install: 'Install',
  addToHome: 'Add to Home Screen',
  notNow: 'Not now',
  tapShare: 'Tap Share',
  tapAdd: 'Tap Add to Home Screen',
  installBody: 'Play offline and full screen.',
};

const accessibleName = (b: HTMLButtonElement): string => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim();
const px = (value: string): number => Number.parseFloat(value);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('banner', () => {
  it('AC-08 every control is a labelled focusable button of 44x44 or more, Esc means Not now, no scrim, no focus trap', () => {
    injectStyles(document);
    const layouts = [BannerLayout.Chip, BannerLayout.Card];
    const variants = [InstallVariant.Prompt, InstallVariant.Ios];
    const combos = layouts.flatMap((layout) => variants.map((variant) => ({ layout, variant })));

    combos.forEach(({ layout, variant }) => {
      const onDismiss = jest.fn();
      const node = renderBanner({ doc: document, layout, variant, appName: 'Aurora', labels, onInstall: jest.fn(), onDismiss });
      document.body.append(node);
      const before = document.activeElement;

      const buttons = Array.from(node.querySelectorAll('button'));
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      buttons.forEach((b) => {
        expect(b.type).toBe('button');
        expect(b.tabIndex).toBe(0);
        expect(accessibleName(b)).not.toBe('');
        const style = getComputedStyle(b);
        expect(px(style.minWidth)).toBeGreaterThanOrEqual(MIN_TARGET_PX);
        expect(px(style.minHeight)).toBeGreaterThanOrEqual(MIN_TARGET_PX);
      });

      expect(node.getAttribute('role')).toBe('region');
      expect(node.getAttribute('aria-label')).not.toBe('');
      expect(node.getAttribute('aria-modal')).toBeNull();
      expect(document.querySelector('.gs-scrim, [aria-modal="true"]')).toBeNull();
      expect(document.activeElement).toBe(before);

      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      buttons[0]?.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);

      buttons[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      node.remove();
    });
  });
});
