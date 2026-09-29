import { prefersReducedMotion, startLifecycle, unlockAudio } from './lifecycle';
import type { Disposable } from '../types';

let handles: Disposable[] = [];

function setVisibility(state: 'hidden' | 'visible'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function setMotion(reduce: boolean, search: string): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: reduce && q === '(prefers-reduced-motion: reduce)' }),
  });
  window.history.replaceState(null, '', `/${search}`);
}

afterEach(() => {
  handles.forEach((h) => h.dispose());
  handles = [];
  window.history.replaceState(null, '', '/');
});

describe('lifecycle', () => {
  it('AC-11 hidden then visible fires onHidden then onVisible, pointerdown twice resumes once, a rejecting resume does not throw', async () => {
    const calls: string[] = [];
    handles.push(startLifecycle({ onHidden: () => calls.push('hidden'), onVisible: () => calls.push('visible') }));
    setVisibility('hidden');
    setVisibility('visible');
    expect(calls).toEqual(['hidden', 'visible']);

    const ctx = { resume: jest.fn().mockResolvedValue(undefined) };
    handles.push(unlockAudio(ctx));
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(ctx.resume).toHaveBeenCalledTimes(1);

    const rejecting = { resume: jest.fn().mockRejectedValue(new Error('NotAllowedError')) };
    handles.push(unlockAudio(rejecting));
    expect(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(rejecting.resume).toHaveBeenCalledTimes(1);

    const throwing = { resume: jest.fn(() => { throw new Error('closed'); }) };
    handles.push(unlockAudio(throwing));
    expect(() => window.dispatchEvent(new Event('pointerdown'))).not.toThrow();
  });

  it('AC-12 OS reduce-motion or ?reducedMotion=1 is true, otherwise false', () => {
    setMotion(true, '');
    expect(prefersReducedMotion()).toBe(true);
    setMotion(false, '?reducedMotion=1');
    expect(prefersReducedMotion()).toBe(true);
    setMotion(false, '');
    expect(prefersReducedMotion()).toBe(false);
    setMotion(false, '?reducedMotion=0');
    expect(prefersReducedMotion()).toBe(false);
  });
});
