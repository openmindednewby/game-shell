import { initGameShell } from './initGameShell';
import type { GameShellLabels } from './types';

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

afterEach(() => {
  document.body.innerHTML = '';
});

describe('initGameShell', () => {
  it('shows the crash overlay in the window that owns the root, not the host window', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const frameWin = frame.contentWindow as Window & typeof globalThis;
    const frameDoc = frameWin.document;
    const root = frameDoc.createElement('div');
    frameDoc.body.append(root);

    const handle = initGameShell({ root, appName: 'Aurora', labels, install: false });
    const evt = new frameWin.Event('unhandledrejection');
    Object.assign(evt, { reason: new Error('boom') });
    frameWin.dispatchEvent(evt);
    expect(frameDoc.querySelector('.gs-crash')).not.toBeNull();
    expect(document.querySelector('.gs-crash')).toBeNull();

    handle.dispose();
    expect(frameDoc.querySelector('.gs-crash')).toBeNull();
    expect(root.classList.contains('gs-root')).toBe(false);
  });

  it('dispose undoes the root class and the --gs-vh variable', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handle = initGameShell({ root, appName: 'Aurora', labels, install: false, crash: false });
    expect(root.classList.contains('gs-root')).toBe(true);
    handle.dispose();
    expect(root.classList.contains('gs-root')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--gs-vh')).toBe('');
  });
});
