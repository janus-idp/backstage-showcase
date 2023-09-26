import { configApiRef, useApi } from '@backstage/core-plugin-api';

export const useUpdateTheme = (
  selTheme: string,
): { primaryColor: string | undefined } => {
  let primaryColor: string | undefined;
  try {
    const configApi = useApi(configApiRef);
    primaryColor = configApi.getOptionalString(
      `app.branding.theme.${selTheme}.primaryColor`,
    );
  } catch (err) {
    // useApi won't be initialized initally in createApp theme provider, and will get updated later
  }
  return { primaryColor };
};
