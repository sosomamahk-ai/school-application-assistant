import { useCallback, useEffect, useState } from 'react';
import type { WordPressSchoolResponse } from '@/types/wordpress';
import { getWordPressSchools, invalidateWordPressSchoolCache } from '@/services/wordpressSchoolService';

interface UseWordPressSchoolsOptions {
  autoFetch?: boolean;
}

export function useWordPressSchools(options?: UseWordPressSchoolsOptions) {
  const autoFetch = options?.autoFetch ?? true;
  const [data, setData] = useState<WordPressSchoolResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (forceRefresh?: boolean) => {
      try {
        setLoading(true);
        if (forceRefresh) {
          invalidateWordPressSchoolCache();
        }
        const response = await getWordPressSchools({ forceRefresh });
        setData(response);
        setError(null);
        return response;
      } catch (err) {
        console.error('[useWordPressSchools] Failed to load WordPress data', err);
        setError(err instanceof Error ? err.message : '无法加载 WordPress 学校数据');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!autoFetch) return;
    fetchData();
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}

export type UseWordPressSchoolsResult = ReturnType<typeof useWordPressSchools>;


