import { unlockAudio } from './lifecycle';
import type { Disposable } from '../types';

let handle: Disposable | null = null;
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  handle?.dispose();
  handle = null;
});

describe('unlockAudio regression', () => {
  it('a touch pointerdown does not spend the unlock, the pointerup that follows resumes', () => {
    const ctx = { state: 'suspended', resume: jest.fn().mockResolvedValue(undefined) };
    handle = unlockAudio(ctx);
    window.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('pointerup'));
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('stays armed while the context is still suspended, detaches once it runs', async () => {
    const ctx = { state: 'suspended', resume: jest.fn().mockResolvedValue(undefined) };
    handle = unlockAudio(ctx);
    window.dispatchEvent(new Event('touchend'));
    await flush();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await flush();
    expect(ctx.resume).toHaveBeenCalledTimes(2);

    ctx.state = 'running';
    window.dispatchEvent(new Event('pointerup'));
    await flush();
    window.dispatchEvent(new Event('pointerup'));
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });
});
