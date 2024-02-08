import { UnifiedThemeOptions } from '@backstage/theme';
import { defaultThemePalette } from './defaultThemePalette';

const redhatFont = `@font-face {
  font-family: 'Red Hat Font';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(/fonts/RedHatText-Regular.woff2) format('woff2'),
    url(/fonts/RedHatText-Regular.otf) format('opentype'),
    url(/fonts/RedHatText-Regular.ttf) format('truetype');
}`;

export const components = (mode: string): UnifiedThemeOptions['components'] => {
  const themePalette = defaultThemePalette(mode);

  return {
    MuiCssBaseline: {
      styleOverrides: redhatFont,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        containedPrimary: {
          backgroundColor: themePalette.primary.main,
          color: themePalette.primary.contrastText,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: themePalette.primary.dark,
            color: themePalette.primary.contrastText,
          },
          '&:disabled': {
            color: themePalette.primary.disabled,
            backgroundColor: themePalette.primary.disabledBackground,
          },
        },
        outlined: {
          color: themePalette.primary.main,
          borderColor: themePalette.primary.main,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `inset 0 0 0 1px ${themePalette.primary.main}`,
            backgroundColor: 'transparent',
          },
        },
        outlinedPrimary: {
          color: themePalette.primary.main,
          borderColor: themePalette.primary.main,
          boxShadow: 'none',
          '&:hover': {
            borderColor: themePalette.primary.main,
            boxShadow: `inset 0 0 0 1px ${themePalette.primary.main}`,
            backgroundColor: 'transparent',
          },
        },
        text: {
          color: themePalette.primary.main,
          '&:hover': {
            color: themePalette.primary.mainHover,
            backgroundColor: 'transparent',
          },
        },
        textPrimary: {
          color: themePalette.primary.main,
          textTransform: 'none',
          '&:hover': {
            color: themePalette.primary.mainHover,
            textTransform: 'none',
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        underlineHover: {
          '&:hover': {
            textDecoration: 'none',
          },
        },
      },
    },
  };
};
