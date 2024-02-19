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
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          border: '0',
          borderRadius: '3px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            border: '0',
            boxShadow: 'none',
          },
          '&:-webkit-any-link:focus-visible': {
            outlineOffset: '0',
          },
        },
        containedPrimary: {
          backgroundColor: themePalette.primary.containedButtonBackground,
          color: themePalette.primary.contrastText,
          '&:hover': {
            backgroundColor: themePalette.primary.dark,
            color: themePalette.primary.contrastText,
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 1px ${themePalette.primary.focusVisibleBorder}`,
            outline: `${themePalette.primary.focusVisibleBorder} solid 1px`,
            backgroundColor: themePalette.primary.dark,
            color: themePalette.primary.contrastText,
          },
          '&:disabled': {
            color: themePalette.primary.disabled,
            backgroundColor: themePalette.primary.disabledBackground,
          },
        },
        containedSecondary: {
          backgroundColor: themePalette.secondary.containedButtonBackground,
          color: themePalette.secondary.contrastText,
          '&:hover': {
            backgroundColor: themePalette.secondary.dark,
            color: themePalette.secondary.contrastText,
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 1px ${themePalette.secondary.focusVisibleBorder}`,
            outline: `${themePalette.secondary.focusVisibleBorder} solid 1px`,
            backgroundColor: themePalette.secondary.dark,
            color: themePalette.secondary.contrastText,
          },
          '&:disabled': {
            color: themePalette.secondary.disabled,
            backgroundColor: themePalette.secondary.disabledBackground,
          },
        },
        outlined: {
          border: '0',
          boxShadow: `inset 0 0 0 1px ${themePalette.primary.main}`,
          '&:hover': {
            border: '0',
            boxShadow: `inset 0 0 0 2px ${themePalette.primary.main}`,
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${themePalette.primary.main}`,
            outline: `${themePalette.primary.focusVisibleBorder} solid 1px`,
          },
        },
        outlinedPrimary: {
          color: themePalette.primary.main,
          boxShadow: `inset 0 0 0 1px ${themePalette.primary.main}`,
          border: '0',
          '&:hover': {
            border: '0',
            boxShadow: `inset 0 0 0 2px ${themePalette.primary.main}`,
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${themePalette.primary.main}`,
            outline: `${themePalette.primary.focusVisibleBorder} solid 1px`,
          },
        },
        outlinedSecondary: {
          color: themePalette.secondary.main,
          boxShadow: `inset 0 0 0 1px ${themePalette.secondary.main}`,
          border: '0',
          '&:hover': {
            border: '0',
            boxShadow: `inset 0 0 0 2px ${themePalette.secondary.main}`,
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${themePalette.secondary.main}`,
            outline: `${themePalette.secondary.focusVisibleBorder} solid 1px`,
          },
        },
        text: {
          color: themePalette.primary.main,
          '&:hover': {
            color: themePalette.primary.textHover,
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${themePalette.primary.main}`,
            outline: `${themePalette.primary.focusVisibleBorder} solid 1px`,
          },
        },
        textPrimary: {
          color: themePalette.primary.main,
          '&:hover': {
            color: themePalette.primary.textHover,
            backgroundColor: 'transparent',
          },
        },
        textSecondary: {
          color: themePalette.secondary.main,
          '&:hover': {
            color: themePalette.secondary.textHover,
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
