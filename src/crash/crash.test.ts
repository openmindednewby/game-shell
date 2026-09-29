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

function fireError(message: string): void {
  window.dispatchEvent(new ErrorEvent('error', { message, filename: 'https://game/app.js', lineno: 12, colno: 7 }));
}

function fireRejection(reason: unknown): void {
  const evt = new Event('unhandledrejection');
  Object.assign(evt, { reason });
  window.dispatchEvent(evt);
}

const overlays = (): NodeListOf<HTMLElement> => document.querySelectorAll('.gs-crash');
const buttonByText = (text: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('.gs-crash button')).find((b) => b.textContent === text);

afterEach(() => {
  handle?.dispose();
  handle = null;
  document.body.innerHTML = '';
});

describe('crash', () => {
  it('AC-09 ErrorEvent and unhandledrejection each report, overlay shows once with title Reload Copy ref, resource-load error ignored', () => {
    const report = jest.fn((_info: CrashInfo) => 'R-42');
    handle = startCrash({ labels, report, reload: jest.fn() });

    const img = document.createElement('img');
    document.body.append(img);
    img.dispatchEvent(new Event('error', { bubbles: false }));
    window.dispatchEvent(new Event('error'));
    expect(report).not.toHaveBeenCalled();
    expect(overlays()).toHaveLength(0);

    fireError('boom');
    fireError('boom again');
    fireRejection(new Error('async boom'));
    fireRejection('plain reason');
    expect(report).toHaveBeenCalledTimes(4);
    expect(report.mock.calls[0]?.[0]).toMatchObject({ kind: 'error', message: 'boom', source: 'https://game/app.js:12:7' });
    expect(report.mock.calls[2]?.[0]).toMatchObject({ kind: 'rejection', message: 'async boom' });
    expect(report.mock.calls[3]?.[0]).toEqual({ kind: 'rejection', message: 'plain reason' });

    expect(overlays()).toHaveLength(1);
    const overlay = overlays()[0];
    expect(overlay?.getAttribute('role')).toBe('alertdialog');
    expect(overlay?.querySelector('#gs-crash-title')?.textContent).toBe(labels.crashTitle);
    expect(buttonByText(labels.reload)).toBeDefined();
    expect(buttonByText(labels.copyDetails)).toBeDefined();
    expect(overlay?.querySelector('.gs-ref')?.textContent).toBe(`${labels.errorReported} R-42`);
  });

  it('AC-10 Reload calls location.reload, Copy writes message source version, focus starts on Reload', async () => {
    const reload = jest.fn();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText } });
    handle = startCrash({ labels, reload, appVersion: '2026.09.30-abc123', report: () => { throw new Error('sink down'); } });

    fireError('boom');
    expect(document.activeElement).toBe(buttonByText(labels.reload));
    expect(document.querySelector('.gs-ref')).toBeNull();

    buttonByText(labels.reload)?.click();
    expect(reload).toHaveBeenCalledTimes(1);

    buttonByText(labels.copyDetails)?.click();
    expect(writeText).toHaveBeenCalledWith('boom\nhttps://game/app.js:12:7\n2026.09.30-abc123');

    writeText.mockRejectedValueOnce(new Error('denied'));
    await expect(Promise.resolve(buttonByText(labels.copyDetails)?.click())).resolves.toBeUndefined();
  });
});
