import { useApi } from '@backstage/core-plugin-api';
import { useCallback, useEffect, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { customDataApiRef } from '../api';
import { QuickAccessLinks } from '../types/types';

export const useQuickAccess = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<QuickAccessLinks[]>();
  const [error, setError] = useState<any>();
  const client = useApi(customDataApiRef);
  const {
    value,
    error: apiError,
    loading,
  } = useAsync(() => client.getHomeDataJson());

  const fetchData = useCallback(async () => {
    const res = await fetch('/homepage/data.json');
    const qsData = await res.json();
    setData(qsData);
    setIsLoading(false);
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
