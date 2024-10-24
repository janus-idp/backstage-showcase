import { useCallback, useEffect, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { useApi } from '@backstage/core-plugin-api';

import { quickAccessApiRef } from '../api/QuickAccessApiClient';
import { QuickAccessLink } from '../types';

export const useQuickAccessLinks = (
  path?: string,
): {
  data: QuickAccessLink[] | undefined;
  error: Error | undefined;
  isLoading: boolean;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<QuickAccessLink[]>();
  const [error, setError] = useState<Error>();
  const client = useApi(quickAccessApiRef);
  const {
    value,
    error: apiError,
    loading,
  } = useAsync(() => {
    return client.getQuickAccessLinks(path);
  });

  const fetchData = useCallback(async () => {
    const res = await fetch('/homepage/data.json');
    const qsData = await res.json();
    setData(qsData);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiError) {
      setError(apiError);
      fetchData().catch(err => {
        setError(err);
        setIsLoading(false);
      });
    } else if (!loading && value) {
      setData(value);
      setIsLoading(false);
    }
  }, [apiError, fetchData, loading, setData, value]);

  return { data, error, isLoading };
};
