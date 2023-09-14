import { createUnifiedTheme, themes } from '@backstage/theme';
import { components } from './componentOverrides';
import { fontFamily } from './consts';
import { pageTheme } from './pageTheme';

export const customDarkTheme = createUnifiedTheme({
  fontFamily,
  palette: {
    ...themes.dark.getTheme('v5')?.palette,
    navigation: {
      background: '#0f1214',
      indicator: '#009596',
      color: '#ffffff',
      selectedColor: '#ffffff',
      navItem: {
        hoverBackground: '#030303',
      },
    },
  },
  defaultPageTheme: 'home',
  pageTheme,
  components,
});
