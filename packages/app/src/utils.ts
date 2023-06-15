import { configApiRef, useApi } from '@backstage/core-plugin-api';

export const useGetBaseURL = () => {
  const config = useApi(configApiRef);
  return config.getString('backend.baseUrl');
};
