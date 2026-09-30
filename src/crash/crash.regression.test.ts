import { startCrash } from './crash';
import type { CrashInfo } from './crashKind';
import type { CrashLabels, Disposable } from '../types';

const labels: CrashLabels = {
  crashTitle: 'The light went out',
  crashBody: 'Reloading does not clear your progress.',
  reload: 'Reload',
  copyDetails: 'Copy error details',
  errorReported: 'Error reported · ref',
};

let handle: Disposable | null = null;

function fireError(message: string, filename: string, lineno = 1): void {
  window.dispatchEvent(new ErrorEvent('error', { message, filename, lineno, colno: 1 }));
}

const overlays = (): NodeListOf<HTMLElement> => document.querySelectorAll('.gs-crash');

afterEach(() => {
  handle?.dispose();
  handle = null;
  document.body.innerHTML = '';
});

describe('crash regression: foreign script errors', () => {
  it('ignores a third-party script error: no report, no overlay', () => {
    const report = jest.fn((_info: CrashInfo) => undefined);
    handle = startCrash({ labels, report, reload: jest.fn() });

    fireError('adsbygoogle.push() error', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', 3);
    fireError('umami failed', 'https://analytics.dloizides.com/script.js', 9);

    expect(report).not.toHaveBeenCalled();
    expect(overlays()).toHaveLength(0);
  });

  it('ignores an opaque cross-origin "Script error." with no filename', () => {
    const report = jest.fn((_info: CrashInfo) => undefined);
    handle = startCrash({ labels, report, reload: jest.fn() });

    fireError('Script error.', '', 0);

    expect(report).not.toHaveBeenCalled();
    expect(overlays()).toHaveLength(0);
  });

  it('still reports and shows the overlay for a same-origin script error', () => {
    const report = jest.fn((_info: CrashInfo) => undefined);
    handle = startCrash({ labels, report, reload: jest.fn() });

    fireError('boom', `${window.location.origin}/assets/game.js`, 4);

    expect(report).toHaveBeenCalledTimes(1);
    expect(overlays()).toHaveLength(1);
  });

  it('reports an error from an allowlisted origin', () => {
    const report = jest.fn((_info: CrashInfo) => undefined);
    handle = startCrash({ labels, report, reload: jest.fn(), origins: ['https://cdn.eisaipollis.com'] });

    fireError('boom', 'https://cdn.eisaipollis.com/morphe/game.js', 4);
    fireError('ad', 'https://pagead2.googlesyndication.com/x.js', 1);

    expect(report).toHaveBeenCalledTimes(1);
    expect(overlays()).toHaveLength(1);
  });

  it('keeps reporting unhandledrejection regardless of origin', () => {
    const report = jest.fn((_info: CrashInfo) => undefined);
    handle = startCrash({ labels, report, reload: jest.fn() });

    const evt = new Event('unhandledrejection');
    Object.assign(evt, { reason: new Error('async boom') });
    window.dispatchEvent(evt);

    expect(report).toHaveBeenCalledTimes(1);
    expect(overlays()).toHaveLength(1);
  });
});
