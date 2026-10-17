export const DEFAULT_OFFLINE_CACHE = 'gs-offline-v1';
export const DEFAULT_OFFLINE_CHUNK = 4;

export interface OfflineProgress {
  done: number;
  total: number;
}

export interface OfflineOptions {
  cacheName?: string;
  chunkSize?: number;
  cachesApi?: CacheStorage;
}

function cachesOf(opts: OfflineOptions): CacheStorage | undefined {
  return opts.cachesApi ?? (typeof caches === 'undefined' ? undefined : caches);
}

export function isOfflineSupported(opts: OfflineOptions = {}): boolean {
  return cachesOf(opts) !== undefined;
}

export async function downloadForOffline(
  urls: readonly string[],
  onProgress?: (progress: OfflineProgress) => void,
  opts: OfflineOptions = {},
): Promise<void> {
  const api = cachesOf(opts);
  if (api === undefined) {
    throw new Error('Cache Storage is not available');
  }
  const unique = [...new Set(urls)];
  const total = unique.length;
  const chunk = Math.max(1, Math.floor(opts.chunkSize ?? DEFAULT_OFFLINE_CHUNK));
  const cache = await api.open(opts.cacheName ?? DEFAULT_OFFLINE_CACHE);
  let done = 0;
  onProgress?.({ done, total });
  for (let i = 0; i < total; i += chunk) {
    const part = unique.slice(i, i + chunk);
    await cache.addAll(part);
    done += part.length;
    onProgress?.({ done, total });
  }
}

export async function isAvailableOffline(urls: readonly string[], opts: OfflineOptions = {}): Promise<boolean> {
  const api = cachesOf(opts);
  if (api === undefined || urls.length === 0) {
    return false;
  }
  const cache = await api.open(opts.cacheName ?? DEFAULT_OFFLINE_CACHE);
  for (const url of urls) {
    if ((await cache.match(url)) === undefined) {
      return false;
    }
  }
  return true;
}
