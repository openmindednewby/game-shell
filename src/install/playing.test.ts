import { initGameShell } from '../initGameShell';
import type { PlayingHandle, GameShellLabels } from '../types';
import { startInstall } from './install';

const T0 = 1_700_000_000_000;
const APP = 'Surge';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1';

const labels: GameShellLabels = {
  install: 'Install',
  addToHome: 'Add to Home Screen',
  notNow: 'Not now',
  tapShare: 'Tap Share',
  tapAdd: 'Tap Add to Home Screen',
  installBody: 'Play offline and full screen.',
  crashTitle: 'The light went out',
  crashBody: 'Reloading does not clear your progress.',
  reload: 'Reload',
  copyDetails: 'Copy error details',
  errorReported: 'Error reported, ref',
};

let handle: PlayingHandle | null = null;

function setEnv(ua: string, width: number): void {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: ua });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
}

function firePrompt(outcome = 'accepted'): jest.Mock {
  const evt = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = jest.fn().mockResolvedValue(undefined);
  Object.assign(evt, { prompt, userChoice: Promise.resolve({ outcome }) });
  window.dispatchEvent(evt);
  return prompt;
}

const banner = (): HTMLElement | null => document.querySelector('.gs-install');
const clickText = (text: string): void =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.gs-install button')).find((b) => b.textContent === text)?.click();
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  localStorage.clear();
  setEnv(ANDROID_UA, 412);
});

afterEach(() => {
  handle?.dispose();
  handle = null;
  document.body.innerHTML = '';
});

describe('setPlaying', () => {
  it('hides the chip during play, holds a prompt fired mid-run, and shows a working chip on the menu', async () => {
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    expect(banner()).not.toBeNull();

    handle.setPlaying(true);
    expect(banner()).toBeNull();
    const prompt = firePrompt();
    window.dispatchEvent(new Event('resize'));
    expect(banner()).toBeNull();

    handle.setPlaying(false);
    expect(banner()?.dataset.layout).toBe('chip');
    clickText(labels.install);
    await flush();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(banner()).toBeNull();

    handle.setPlaying(true);
    handle.setPlaying(false);
    expect(banner()).toBeNull();
  });

  it('hides the desktop card and the iOS chip during play and brings each back', () => {
    setEnv(ANDROID_UA, 1280);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    handle.setPlaying(true);
    expect(banner()).toBeNull();
    handle.setPlaying(false);
    expect(banner()?.dataset.layout).toBe('card');
    handle.dispose();

    setEnv(IOS_UA, 390);
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    handle.setPlaying(true);
    expect(banner()).toBeNull();
    handle.setPlaying(false);
    expect(banner()?.querySelector('.gs-steps')).not.toBeNull();
  });

  it('keeps the chip hidden on the menu after Not now', () => {
    handle = startInstall({ appName: APP, labels, now: () => T0 });
    firePrompt();
    document.querySelector<HTMLButtonElement>('.gs-install .gs-x')?.click();
    handle.setPlaying(true);
    handle.setPlaying(false);
    expect(banner()).toBeNull();
  });

  it('initGameShell forwards setPlaying to the install chip', () => {
    const root = document.createElement('div');
    document.body.append(root);
    handle = initGameShell({ root, appName: APP, labels, crash: false });
    firePrompt();
    handle.setPlaying(true);
    expect(banner()).toBeNull();
    handle.setPlaying(false);
    expect(banner()).not.toBeNull();
  });
});
