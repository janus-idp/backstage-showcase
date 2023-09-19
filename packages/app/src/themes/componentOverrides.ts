import { UnifiedThemeOptions } from '@backstage/theme';
import { headerFontFamily } from './consts';

export const components: UnifiedThemeOptions['components'] = {
  MuiTypography: {
    styleOverrides: {
      h1: {
        fontFamily: headerFontFamily,
      },
      h2: {
        fontFamily: headerFontFamily,
      },
      h3: {
        fontFamily: headerFontFamily,
      },
      h4: {
        fontFamily: headerFontFamily,
      },
      h5: {
        fontFamily: headerFontFamily,
      },
    },
  },
};
