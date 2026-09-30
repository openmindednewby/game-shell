import { CardPlacement } from './CardPlacement';
import { startInstall } from './install';
import type { Disposable, InstallLabels } from '../types';

const DAY_MS = 86_400_000;
const T0 = 1_700_000_000_000;
const APP = 'Aurora';
const KEY = `gs-install-snooze:${APP}`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1';

const labels: InstallLabels = {
  install: 'Install',
  addToHome: 'Add to Home Screen',
  notNow: 'Not now',
  tapShare: 'Tap Share',
  tapAdd: 'Tap Add to Home Screen',
  installBody: 'Play offline and full screen.',
};

let handle: Disposable | null = null;

function setEnv(ua: string, width: number, standaloneMedia = false): void {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: ua });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: standaloneMedia && q.includes('standalone') }),
  });
}

function firePrompt(outcome = 'accepted'): { prompt: jest.Mock; defaultPrevented: () => boolean } {
  const evt = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = jest.fn().mockResolvedValue(undefined);
  Object.assign(evt, { prompt, userChoice: Promise.resolve({ outcome }) });
  window.dispatchEvent(evt);
  return { prompt, defaultPrevented: () => evt.defaultPrevented };
}

const banner = (): HTMLElement | null => document.querySelector('.gs-install');
const buttonByText = (text: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.gs-install button')).find((b) => b.textContent === text);
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  localStorage.clear();
  setEnv(ANDROID_UA, 412);
});

afterEach(() => {
  handle?.dispose();
  handle = null;
  jest.restoreAllMocks();
  Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: undefined });
});

describe('install', () => {
  it('AC-03 Android beforeinstallprompt shows the top-left chip, Install prompts, a native dismiss keeps it hidden for the session, appinstalled removes it', async () => {
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    expect(banner()).toBeNull();

    const fired = firePrompt('dismissed');
    expect(fired.defaultPrevented()).toBe(true);
    expect(banner()?.dataset.layout).toBe('chip');
    expect(banner()?.querySelector('.gs-seal .gs-chip')?.textContent).toBe(labels.install);

    buttonByText(labels.install)?.click();
    await flush();
    expect(fired.prompt).toHaveBeenCalledTimes(1);
    expect(banner()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(String(T0));

    firePrompt();
    expect(banner()).toBeNull();
    handle.dispose();

    localStorage.clear();
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    expect(banner()).not.toBeNull();
    window.dispatchEvent(new Event('appinstalled'));
    expect(banner()).toBeNull();
  });

  it('AC-04 standalone shows no chip', () => {
    setEnv(ANDROID_UA, 412, true);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    expect(banner()).toBeNull();
    handle.dispose();

    setEnv(IOS_UA, 390);
    Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true });
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    expect(banner()).toBeNull();
  });

  it('AC-05 dismissed at T is hidden at T+13d, shown at T+14d, shown without throwing when localStorage throws', () => {
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    document.querySelector<HTMLButtonElement>('.gs-install .gs-x')?.click();
    expect(banner()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(String(T0));
    handle.dispose();

    handle = startInstall({ appName: APP, labels, now: () => T0 + 13 * DAY_MS });
    firePrompt();
    expect(banner()).toBeNull();
    handle.dispose();

    handle = startInstall({ appName: APP, labels, now: () => T0 + 14 * DAY_MS });
    firePrompt();
    expect(banner()).not.toBeNull();
    handle.dispose();

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const uncaught = jest.fn();
    window.addEventListener('error', uncaught);
    handle = startInstall({ appName: APP, labels, now: () => T0 + DAY_MS });
    firePrompt();
    expect(banner()).not.toBeNull();
    document.querySelector<HTMLButtonElement>('.gs-install .gs-x')?.click();
    expect(banner()).toBeNull();
    window.removeEventListener('error', uncaught);
    expect(uncaught).not.toHaveBeenCalled();
  });

  it('AC-06 iOS Safari shows Add to Home Screen chip and tapping opens the 2-step popover', () => {
    setEnv(IOS_UA, 390);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    const chip = buttonByText(labels.addToHome);
    const steps = document.querySelector<HTMLOListElement>('.gs-install .gs-steps');
    expect(banner()?.dataset.layout).toBe('chip');
    expect(chip?.getAttribute('aria-expanded')).toBe('false');
    expect(steps?.hidden).toBe(true);

    chip?.click();
    expect(steps?.hidden).toBe(false);
    expect(chip?.getAttribute('aria-expanded')).toBe('true');
    expect(Array.from(steps?.querySelectorAll('li') ?? []).map((li) => li.textContent)).toEqual([labels.tapShare, labels.tapAdd]);
  });

  it('AC-07 width 1024 or more shows the bottom-right card, not the chip', () => {
    setEnv(ANDROID_UA, 1280);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    expect(banner()?.dataset.layout).toBe('card');
    expect(document.querySelector('.gs-install .gs-card')).not.toBeNull();
    expect(document.querySelector('.gs-install .gs-seal')).toBeNull();
    expect(buttonByText(labels.notNow)).toBeDefined();

    setEnv(ANDROID_UA, 412);
    window.dispatchEvent(new Event('resize'));
    expect(banner()?.dataset.layout).toBe('chip');
  });

  it('D25 the desktop card defaults to bottom-right and takes top-right when a game asks for it', () => {
    setEnv(ANDROID_UA, 1280);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    expect(banner()?.dataset.placement).toBe(CardPlacement.BottomRight);
    handle.dispose();
    document.body.innerHTML = '';

    handle = startInstall({ appName: APP, labels, now: () => T0, cardPlacement: CardPlacement.TopRight });
    firePrompt();
    expect(banner()?.dataset.placement).toBe(CardPlacement.TopRight);

    setEnv(ANDROID_UA, 412);
    window.dispatchEvent(new Event('resize'));
    expect(banner()?.dataset.layout).toBe('chip');
    expect(banner()?.dataset.placement).toBeUndefined();
  });
});
