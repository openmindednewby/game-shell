import { downloadForOffline, isAvailableOffline, isOfflineSupported } from './offline';
import type { OfflineProgress } from './offline';
import { mountOfflineButton, OFFLINE_STATE } from './offlineButton';

const LABELS = { download: 'Download all stages', progress: '{done} / {total}', available: 'Available offline', failed: 'Download failed' };

interface FakeCaches {
  api: CacheStorage;
  addAll: jest.Mock;
  stored: Set<string>;
}

function fakeCaches(failOn = ''): FakeCaches {
  const stored = new Set<string>();
  const addAll = jest.fn(async (urls: string[]) => {
    if (urls.includes(failOn)) {
      throw new TypeError('network');
    }
    urls.forEach((u) => stored.add(u));
  });
  const cache = { addAll, match: async (u: string) => (stored.has(u) ? ({} as Response) : undefined) };
  const api = { open: jest.fn(async () => cache) } as unknown as CacheStorage;
  return { api, addAll, stored };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('downloadForOffline', () => {
  it('with 5 urls, one duplicate and chunk 2, adds 4 unique urls in chunks of 2 and reports each step', async () => {
    const fake = fakeCaches();
    const steps: OfflineProgress[] = [];

    await downloadForOffline(['/a', '/b', '/a', '/c', '/d'], (p) => steps.push(p), { cachesApi: fake.api, chunkSize: 2 });

    expect([fake.addAll.mock.calls, steps]).toEqual([
      [[['/a', '/b']], [['/c', '/d']]],
      [{ done: 0, total: 4 }, { done: 2, total: 4 }, { done: 4, total: 4 }],
    ]);
  });

  it('with a chunk failing, rejects and stops before the next chunk', async () => {
    const fake = fakeCaches('/c');

    const run = downloadForOffline(['/a', '/b', '/c', '/d', '/e'], undefined, { cachesApi: fake.api, chunkSize: 2 });

    await expect(run).rejects.toThrow('network');
    expect(fake.addAll).toHaveBeenCalledTimes(2);
  });
});

describe('isAvailableOffline', () => {
  it('with one url missing from the cache, returns false', async () => {
    const fake = fakeCaches();
    fake.stored.add('/a');

    const result = await isAvailableOffline(['/a', '/b'], { cachesApi: fake.api });

    expect(result).toBe(false);
  });

  it('with every url cached, returns true', async () => {
    const fake = fakeCaches();
    ['/a', '/b'].forEach((u) => fake.stored.add(u));

    const result = await isAvailableOffline(['/a', '/b'], { cachesApi: fake.api });

    expect(result).toBe(true);
  });

  it('with an empty url list, returns false', async () => {
    const fake = fakeCaches();

    const result = await isAvailableOffline([], { cachesApi: fake.api });

    expect(result).toBe(false);
  });
});

describe('isOfflineSupported', () => {
  it('without Cache Storage in the page, returns false', () => {
    const result = isOfflineSupported();

    expect(result).toBe(false);
  });
});

describe('mountOfflineButton', () => {
  it('with every url already cached, shows the available state with the button disabled', async () => {
    const fake = fakeCaches();
    fake.stored.add('/a');
    mountOfflineButton({ parent: document.body, urls: ['/a'], labels: LABELS, cachesApi: fake.api });

    await settle();

    const root = document.querySelector<HTMLElement>('.gs-offline');
    expect([root?.dataset.state, root?.textContent, root?.querySelector('button')?.disabled])
      .toEqual([OFFLINE_STATE.Done, LABELS.available, true]);
  });

  it('with a click and a successful download, ends available and calls onDone', async () => {
    const fake = fakeCaches();
    const onDone = jest.fn();
    mountOfflineButton({ parent: document.body, urls: ['/a', '/b'], labels: LABELS, cachesApi: fake.api, onDone });
    await settle();

    document.querySelector<HTMLButtonElement>('.gs-offline button')?.click();
    await settle();

    expect([document.querySelector<HTMLElement>('.gs-offline')?.dataset.state, onDone.mock.calls.length]).toEqual([OFFLINE_STATE.Done, 1]);
  });

  it('with a click shows working progress text while the download runs', async () => {
    const fake = fakeCaches();
    mountOfflineButton({ parent: document.body, urls: ['/a', '/b'], labels: LABELS, cachesApi: fake.api });
    await settle();

    document.querySelector<HTMLButtonElement>('.gs-offline button')?.click();

    const root = document.querySelector<HTMLElement>('.gs-offline');
    expect([root?.dataset.state, root?.textContent]).toEqual([OFFLINE_STATE.Working, '0 / 2']);
  });

  it('with the download failing, shows the failed label and re-enables the button', async () => {
    const fake = fakeCaches('/b');
    mountOfflineButton({ parent: document.body, urls: ['/a', '/b'], labels: LABELS, cachesApi: fake.api });
    await settle();

    document.querySelector<HTMLButtonElement>('.gs-offline button')?.click();
    await settle();

    const root = document.querySelector<HTMLElement>('.gs-offline');
    expect([root?.dataset.state, root?.textContent, root?.querySelector('button')?.disabled])
      .toEqual([OFFLINE_STATE.Failed, LABELS.failed, false]);
  });

  it('without Cache Storage, mounts nothing', () => {
    const parent = document.createElement('div');

    mountOfflineButton({ parent, urls: ['/a'], labels: LABELS });

    expect(parent.childElementCount).toBe(0);
  });
});
