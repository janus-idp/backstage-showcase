import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { ThemeColors } from '../types/types';

export const useUpdateTheme = (selTheme: string): ThemeColors => {
  const themeColors: ThemeColors = {};
  try {
    const configApi = useApi(configApiRef);
    themeColors.primaryColor = configApi.getOptionalString(
      `app.branding.theme.${selTheme}.primaryColor`,
    );
    themeColors.headerColor1 = configApi.getOptionalString(
      `app.branding.theme.${selTheme}.headerColor1`,
    );
    themeColors.headerColor2 = configApi.getOptionalString(
      `app.branding.theme.${selTheme}.headerColor2`,
    );
    themeColors.navigationIndicatorColor = configApi.getOptionalString(
      `app.branding.theme.${selTheme}.navigationIndicatorColor`,
    );
  } catch (err) {
    // useApi won't be initialized initially in createApp theme provider, and will get updated later
  }
  return themeColors;
};
