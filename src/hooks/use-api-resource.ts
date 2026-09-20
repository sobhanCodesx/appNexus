import { useCallback, useEffect, useState } from 'react';

import {
  cachedResource,
  fetchResource,
  isResourceFresh,
} from '@/services/resource-cache';

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : 'خطا در دریافت اطلاعات';
}

export function useApiResource<T>(path: string, initialData: T, ttl = 30_000) {
  const cached = cachedResource<T>(path);
  const [data, setData] = useState<T>(cached ?? initialData);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (isResourceFresh(path, ttl)) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    fetchResource<T>(path, { ttl })
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((value: unknown) => {
        if (!active) return;
        setError(errorMessage(value));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, ttl]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      setData(await fetchResource<T>(path, { force: true, ttl }));
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setRefreshing(false);
    }
  }, [path, ttl]);

  return { data, loading, refreshing, error, refresh };
}
