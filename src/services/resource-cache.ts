import { apiRequest } from '@/services/api';

type Entry = {
  value: unknown;
  cachedAt: number;
};

const cache = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();
const DEFAULT_TTL = 30_000;

export function cachedResource<T>(path: string): T | undefined {
  return cache.get(path)?.value as T | undefined;
}

export function isResourceFresh(path: string, ttl = DEFAULT_TTL) {
  const entry = cache.get(path);
  return Boolean(entry && Date.now() - entry.cachedAt < ttl);
}

export async function fetchResource<T>(
  path: string,
  options: { force?: boolean; ttl?: number } = {},
): Promise<T> {
  const ttl = options.ttl ?? DEFAULT_TTL;
  const existing = cache.get(path);

  if (!options.force && existing && Date.now() - existing.cachedAt < ttl) {
    return existing.value as T;
  }

  const pending = inFlight.get(path);
  if (!options.force && pending) return pending as Promise<T>;

  const request = apiRequest<T>(path)
    .then((value) => {
      cache.set(path, { value, cachedAt: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, request);
  return request;
}

export function invalidateResource(path?: string) {
  if (!path) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key === path || key.startsWith(path)) cache.delete(key);
  }
}
