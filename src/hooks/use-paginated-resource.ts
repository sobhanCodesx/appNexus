import { useCallback, useMemo, useState } from 'react';

import { apiRequest } from '@/services/api';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type ExtraPageState<T> = {
  path: string;
  page: number;
  items: T[];
  loading: boolean;
};

function pagePath(path: string, page: number) {
  const separator = path.includes('?') ? '&' : '?';
  return path + separator + 'page=' + page;
}

export function usePaginatedResource<T>(
  path: string,
  ttl = 20_000,
) {
  const first = useApiResource<Paginated<T>>(path, { data: [] }, ttl);
  const [extra, setExtra] = useState<ExtraPageState<T>>({
    path: '',
    page: 1,
    items: [],
    loading: false,
  });

  const activeExtra = extra.path === path ? extra : null;
  const currentPage = activeExtra?.page ?? first.data.current_page ?? 1;
  const lastPage = first.data.last_page ?? currentPage;
  const hasMore = Boolean(first.data.next_page_url) || currentPage < lastPage;

  const items = useMemo(
    () => [
      ...(first.data.data || []),
      ...(activeExtra?.items || []),
    ],
    [activeExtra?.items, first.data.data],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || (extra.path === path && extra.loading)) return;

    const basePage = extra.path === path
      ? extra.page
      : first.data.current_page ?? 1;
    const nextPage = basePage + 1;

    setExtra((current) => ({
      path,
      page: current.path === path ? current.page : basePage,
      items: current.path === path ? current.items : [],
      loading: true,
    }));

    try {
      const result = await apiRequest<Paginated<T>>(pagePath(path, nextPage));
      setExtra((current) => ({
        path,
        page: result.current_page ?? nextPage,
        items: [
          ...(current.path === path ? current.items : []),
          ...(result.data || []),
        ],
        loading: false,
      }));
    } catch {
      setExtra((current) => ({
        ...current,
        loading: false,
      }));
    }
  }, [extra.loading, extra.page, extra.path, first.data.current_page, hasMore, path]);

  const refresh = useCallback(async () => {
    setExtra({ path: '', page: 1, items: [], loading: false });
    await first.refresh();
  }, [first.refresh]);

  return {
    ...first,
    data: {
      ...first.data,
      data: items,
    },
    items,
    hasMore,
    loadingMore: activeExtra?.loading ?? false,
    loadMore,
    refresh,
  };
}
