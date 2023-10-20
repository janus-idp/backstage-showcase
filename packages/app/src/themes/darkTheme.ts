import { createUnifiedTheme, themes } from '@backstage/theme';
import { components } from './componentOverrides';
import { pageTheme } from './pageTheme';
import { ThemeColors } from '../types/types';

export const customDarkTheme = (themeColors: ThemeColors) =>
  createUnifiedTheme({
    palette: {
      ...themes.dark.getTheme('v5')?.palette,
      ...(themeColors.primaryColor && {
        primary: {
          ...themes.light.getTheme('v5')?.palette.primary,
          main: themeColors.primaryColor,
        },
      }),
      navigation: {
        background: '#0f1214',
        indicator: themeColors.navigationIndicatorColor || '#009596',
        color: '#ffffff',
        selectedColor: '#ffffff',
        navItem: {
          hoverBackground: '#030303',
        },
      },
    },
    defaultPageTheme: 'home',
    pageTheme: pageTheme(themeColors),
    components,
  });
