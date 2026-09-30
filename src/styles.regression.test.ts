import { GAME_SHELL_CSS } from './styles';

interface Rule {
  selector: string;
  body: string;
  index: number;
}

const CLASS_OR_ATTR = /[.[:]/g;
const ELEMENT = /(^|[\s>+~])[a-z]+/g;

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
  const classes = (selector.match(CLASS_OR_ATTR) ?? []).length;
  const elements = (selector.match(ELEMENT) ?? []).length;
  return classes * 10 + elements;
}

function backgroundRule(selector: string): Rule | undefined {
  return rules(GAME_SHELL_CSS).find((r) => r.selector === selector && /(^|;)background:/.test(r.body));
}

describe('styles: primary button fill', () => {
  it('lets the primary accent fill beat the button background reset', () => {
    const reset = backgroundRule('.gs button');
    const primary = rules(GAME_SHELL_CSS).find((r) => r.body.includes('background:var(--gs-accent)') && r.selector.includes('.gs-primary'));
    expect(reset).toBeDefined();
    expect(primary).toBeDefined();
    const resetSpec = specificity(String(reset?.selector));
    const primarySpec = specificity(String(primary?.selector));
    const wins = primarySpec > resetSpec || (primarySpec === resetSpec && Number(primary?.index) > Number(reset?.index));
    expect(primary?.selector).toBe('.gs .gs-primary');
    expect(wins).toBe(true);
  });
});
