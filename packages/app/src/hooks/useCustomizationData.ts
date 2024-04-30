import { useApi } from '@backstage/core-plugin-api';
import { useCallback, useEffect, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { customDataApiRef } from '../api';
import { CustomzationDataLinks } from '../types/types';

const homePage = 'homePage';
export const learningPathPage = 'learningPathPage';

const supportedCustomizationFallbackData = {
  [homePage]: {
    fallback: '/homepage/data.json',
  },
  [learningPathPage]: {
    fallback: '/learning-paths/data.json',
  },
};

export const useCustomizationData = (
  selectedCustomizationPage: 'homePage' | 'learningPathPage' = homePage,
): {
  data: CustomzationDataLinks | undefined;
  error: Error | undefined;
  isLoading: boolean;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<CustomzationDataLinks>();
  const [error, setError] = useState<Error>();
  const client = useApi(customDataApiRef);
  const {
    value,
    error: apiError,
    loading,
  } = useAsync(() => {
    if (selectedCustomizationPage === learningPathPage) {
      return client.getLearningPathDataJson();
    }
    return client.getHomeDataJson();
  });

  const fetchData = useCallback(async () => {
    const res = await fetch(
      supportedCustomizationFallbackData[selectedCustomizationPage].fallback,
    );
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
