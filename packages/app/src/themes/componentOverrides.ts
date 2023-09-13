import { UnifiedThemeOptions } from '@backstage/theme';

const redhatFont = `@font-face {
  font-family: 'Red Hat Font';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(/fonts/RedHatText-Regular.woff2) format('woff2'),
    url(/fonts/RedHatText-Regular.otf) format('opentype'),
    url(/fonts/RedHatText-Regular.ttf) format('truetype');
}`;

export const components: UnifiedThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: redhatFont,
  },
};
