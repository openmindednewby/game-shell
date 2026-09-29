import { startVersionPoll } from './versionPoll';
import type { Disposable } from '../types';

const INTERVAL_MS = 60_000;
const URL = '/version.txt';

let handle: Disposable | null = null;

function response(body: string): Response {
  return { ok: true, text: () => Promise.resolve(body) } as unknown as Response;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  handle?.dispose();
  handle = null;
  jest.useRealTimers();
});

describe('versionPoll regression', () => {
  it('stops its interval once the new version has fired', async () => {
    const onNewVersion = jest.fn();
    const fetchFn = jest.fn().mockResolvedValueOnce(response('v1')).mockResolvedValue(response('v2'));
    handle = startVersionPoll({ url: URL, intervalMs: INTERVAL_MS, onNewVersion, fetchFn });
    await settle();
    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    expect(onNewVersion).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('a fetch that settles after dispose never calls onNewVersion', async () => {
    const onNewVersion = jest.fn();
    let release: (r: Response) => void = () => undefined;
    const fetchFn = jest.fn()
      .mockResolvedValueOnce(response('v1'))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { release = resolve; }));
    handle = startVersionPoll({ url: URL, intervalMs: INTERVAL_MS, onNewVersion, fetchFn });
    await settle();
    jest.advanceTimersByTime(INTERVAL_MS);
    await settle();
    handle.dispose();
    release(response('v2'));
    await settle();
    expect(onNewVersion).not.toHaveBeenCalled();
  });
});
