import { UnifiedThemeOptions } from '@backstage/theme';
import { ThemeColors } from '../types/types';

const redhatFont = `@font-face {
  font-family: 'Red Hat Font';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(/fonts/RedHatText-Regular.woff2) format('woff2'),
    url(/fonts/RedHatText-Regular.otf) format('opentype'),
    url(/fonts/RedHatText-Regular.ttf) format('truetype');
}`;

export const components = (
  themeColors: ThemeColors,
): UnifiedThemeOptions['components'] => {
  return {
    BackstageHeaderTabs: {
      styleOverrides: {
        tabsWrapper: {
          paddingLeft: '0px',
        },
        defaultTab: {
          textTransform: 'none',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTabs: {
      defaultProps: {
        TabIndicatorProps: {
          style: {
            height: '3px',
            background: themeColors.navigationIndicatorColor || '#0066CC',
          },
        },
      },
      styleOverrides: {
        root: {
          borderBottom: '1px solid #d2d2d2',
        },
      },
    },
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          minWidth: 'initial !important',
          '&:hover': {
            boxShadow: '0 -3px #b8bbbe inset',
          },
        },
        disabled: {
          backgroundColor: '#6a6e73',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: redhatFont,
    },
  };
};
