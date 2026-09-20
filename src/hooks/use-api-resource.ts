import { useCallback, useEffect, useState } from 'react';

import { apiRequest } from '@/services/api';

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : 'خطا در دریافت اطلاعات';
}

export function useApiResource<T>(path: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<T>(path)
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
  }, [path]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      setData(await apiRequest<T>(path));
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setRefreshing(false);
    }
  }, [path]);

  return { data, loading, refreshing, error, refresh };
}
