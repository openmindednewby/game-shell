import { GS_RESIZE_EVENT, GS_VH_VAR, startFit } from './fit';
import type { Disposable } from '../types';

type FrameCb = (t: number) => void;

let frames: FrameCb[] = [];
let handle: Disposable | null = null;

const flushFrames = (): void => {
  const pending = frames;
  frames = [];
  pending.forEach((cb) => cb(0));
};
const vhVar = (): string => document.documentElement.style.getPropertyValue(GS_VH_VAR);

function fakeViewport(width: number, height: number): EventTarget & { width: number; height: number } {
  return Object.assign(new EventTarget(), { width, height });
}

beforeEach(() => {
  frames = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameCb) => {
    frames.push(cb);
    return frames.length;
  });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 750 });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
});

afterEach(() => {
  handle?.dispose();
  handle = null;
  jest.restoreAllMocks();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  document.documentElement.style.removeProperty(GS_VH_VAR);
});

describe('fit', () => {
  it('AC-01 visualViewport 664 then 780 then orientationchange sets --gs-vh each time with one gs:resize per change', () => {
    const vv = fakeViewport(390, 664);
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv });
    const events: Array<{ width: number; height: number }> = [];
    const onResize = (e: Event): void => {
      events.push((e as CustomEvent<{ width: number; height: number }>).detail);
    };
    window.addEventListener(GS_RESIZE_EVENT, onResize);

    handle = startFit();
    expect(vhVar()).toBe('664px');
    expect(events).toHaveLength(0);

    vv.height = 780;
    vv.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(vhVar()).toBe('780px');
    expect(events).toEqual([{ width: 390, height: 780 }]);

    vv.width = 844;
    vv.height = 356;
    window.dispatchEvent(new Event('orientationchange'));
    flushFrames();
    expect(vhVar()).toBe('356px');
    expect(events).toHaveLength(2);

    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(events).toHaveLength(2);
    window.removeEventListener(GS_RESIZE_EVENT, onResize);
  });

  it('AC-02 no visualViewport falls back to innerHeight', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
    handle = startFit();
    expect(vhVar()).toBe('750px');

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(vhVar()).toBe('600px');
  });
});
