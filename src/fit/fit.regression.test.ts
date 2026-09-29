import { GS_VH_VAR, startFit } from './fit';

const vhVar = (): string => document.documentElement.style.getPropertyValue(GS_VH_VAR);

describe('fit regression', () => {
  it('dispose removes --gs-vh from the document root', () => {
    const handle = startFit();
    expect(vhVar()).not.toBe('');
    handle.dispose();
    expect(vhVar()).toBe('');
  });
});
