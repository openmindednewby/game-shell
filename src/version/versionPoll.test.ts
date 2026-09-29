import { startVersionPoll } from './versionPoll';
import type { Disposable } from '../types';

const INTERVAL_MS = 60_000;
const URL = '/version.txt';

let handle: Disposable | null = null;

function response(body: string, ok = true): Response {
  return { ok, text: () => Promise.resolve(body) } as unknown as Response;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

function setVisible(): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  handle?.dispose();
  handle = null;
  jest.useRealTimers();
});

describe('versionPoll', () => {
  it('AC-13 v1 then v2 on tick or visible calls onNewVersion once, a fetch error neither calls nor throws', async () => {
    const onNewVersion = jest.fn();
    const fetchFn = jest.fn()
      .mockResolvedValueOnce(response('v1\n'))
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response('down', false))
      .mockResolvedValueOnce(response('v1'))
      .mockResolvedValue(response('v2'));
    handle = startVersionPoll({ url: URL, intervalMs: INTERVAL_MS, onNewVersion, fetchFn });
    await settle();
    expect(fetchFn).toHaveBeenCalledWith(URL, { cache: 'no-store' });

    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    setVisible();
    await settle();
    expect(onNewVersion).not.toHaveBeenCalled();

    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    expect(onNewVersion).toHaveBeenCalledTimes(1);

    setVisible();
    await settle();
    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    expect(onNewVersion).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(5);
  });
});
