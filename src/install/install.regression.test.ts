import { startInstall } from './install';
import type { Disposable, InstallLabels } from '../types';

const APP = 'Aurora';
const T0 = 1_700_000_000_000;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36';
const MOBILE_WIDTH = 412;

const labels: InstallLabels = {
  install: 'Install',
  addToHome: 'Add to Home Screen',
  notNow: 'Not now',
  tapShare: 'Tap Share',
  tapAdd: 'Tap Add to Home Screen',
  installBody: 'Play offline and full screen.',
};

let handle: Disposable | null = null;

function firePrompt(): Event {
  const evt = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(evt, { prompt: jest.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'accepted' }) });
  window.dispatchEvent(evt);
  return evt;
}

const banner = (): HTMLElement | null => document.querySelector('.gs-install');

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: ANDROID_UA });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: MOBILE_WIDTH });
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
});

afterEach(() => {
  handle?.dispose();
  handle = null;
});

describe('install regression', () => {
  it('a beforeinstallprompt re-fired after Not now does not bring the chip back', () => {
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    document.querySelector<HTMLButtonElement>('.gs-install .gs-x')?.click();
    expect(banner()).toBeNull();

    const again = firePrompt();
    expect(again.defaultPrevented).toBe(true);
    expect(banner()).toBeNull();
  });
});
