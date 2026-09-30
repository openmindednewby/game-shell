import { renderCrashOverlay } from './crash/crashOverlay';
import { GAME_SHELL_CSS } from './styles';

interface Rule {
  selector: string;
  body: string;
  index: number;
}

const CLASS_OR_ATTR = /[.[:]/g;
const ELEMENT = /(^|[\s>+~])[a-z]+/g;
const RELOAD_ARC = 'M20 12a8 8 0 1 1-2.3-5.6';

function rules(css: string): Rule[] {
  const out: Rule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m = re.exec(css);
  while (m !== null) {
    out.push({ selector: m[1].trim(), body: m[2], index: m.index });
    m = re.exec(css);
  }
  return out;
}

function specificity(selector: string): number {
  return (selector.match(CLASS_OR_ATTR) ?? []).length * 10 + (selector.match(ELEMENT) ?? []).length;
}

function beats(a: Rule, b: Rule): boolean {
  const sa = specificity(a.selector);
  const sb = specificity(b.selector);
  return sa > sb || (sa === sb && a.index > b.index);
}

function fontRule(classToken: string): Rule | undefined {
  return rules(GAME_SHELL_CSS).find((r) => r.selector.split(' ').pop() === classToken && /(^|;)font:/.test(r.body));
}

const reset = (): Rule | undefined => rules(GAME_SHELL_CSS).find((r) => r.selector === '.gs button');

describe('Lintel mockup match', () => {
  it.each([
    ['.gs-btn', '700 16px/1 var(--gs-font-text)'],
    ['.gs-chip', '700 15px var(--gs-font-text)'],
  ])('%s label font beats the .gs button font reset', (token, font) => {
    const rule = fontRule(token);
    const base = reset();
    expect(rule?.body).toContain(`font:${font}`);
    expect(base).toBeDefined();
    expect(rule !== undefined && base !== undefined && beats(rule, base)).toBe(true);
  });

  it('insets the install chip 16px from the safe edge', () => {
    const chip = rules(GAME_SHELL_CSS).find((r) => r.selector === '.gs-install');
    expect(chip?.body).toContain('top:calc(16px + var(--gs-safe-top))');
    expect(chip?.body).toContain('left:calc(16px + var(--gs-safe-left))');
  });

  it('Reload carries the reload icon and keeps its label text', () => {
    const labels = { crashTitle: 't', crashBody: 'b', reload: 'Reload', copyDetails: 'c', errorReported: 'r' };
    const view = renderCrashOverlay({ doc: document, labels, onReload: jest.fn(), onCopy: jest.fn() });
    expect(view.reload.querySelector('svg path')?.getAttribute('d')).toBe(RELOAD_ARC);
    expect(view.reload.textContent).toBe('Reload');
  });
});
