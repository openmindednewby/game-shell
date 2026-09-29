import { isStandalone } from './platform';

const fakeWin = (mode: string): Window =>
  ({ matchMedia: (q: string) => ({ matches: q.includes(mode) }), navigator: {} }) as unknown as Window;

describe('platform regression', () => {
  it('display-mode fullscreen counts as installed', () => {
    expect(isStandalone(fakeWin('fullscreen'))).toBe(true);
    expect(isStandalone(fakeWin('browser'))).toBe(false);
  });
});
