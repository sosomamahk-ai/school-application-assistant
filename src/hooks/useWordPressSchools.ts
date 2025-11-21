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
    async (forceRefresh?: boolean, retryCount = 0) => {
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
        const errorMessage = err instanceof Error ? err.message : '无法加载 WordPress 学校数据';
        console.error('[useWordPressSchools] Failed to load WordPress data', err);
        
        // Retry once if it's a network error and we haven't retried yet
        if (retryCount === 0 && errorMessage.includes('无法连接到服务器')) {
          console.log('[useWordPressSchools] Retrying after 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchData(forceRefresh, 1);
        }
        
        setError(errorMessage);
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


