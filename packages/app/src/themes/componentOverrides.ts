import { UnifiedThemeOptions } from '@backstage/theme';
import { defaultThemePalette } from './defaultThemePalette';
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
  mode: string,
): UnifiedThemeOptions['components'] => {
  const themePalette = defaultThemePalette(mode);
  return {
    BackstageHeaderTabs: {
      styleOverrides: {
        tabsWrapper: {
          paddingLeft: '0',
        },
        defaultTab: {
          textTransform: 'none',
          fontSize: '0.875rem',
          '&:hover': {
            boxShadow: '0 -3px #b8bbbe inset',
          },
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
          textTransform: 'none',
          minWidth: 'initial !important',
          '&.Mui-disabled': {
            backgroundColor: '#d2d2d2',
          },
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          backgroundColor: themePalette.general.sideBarBackgroundColor,
        },
      },
    },
    BackstageContent: {
      styleOverrides: {
        root: {
          backgroundColor: themePalette.general.mainSectionBackgroundColor,
          '& div:first-child': {
            '& > div[class*="-searchBar"]': {
              backgroundColor: themePalette.general.formControlBackgroundColor,
              boxShadow: `0px 2px 1px -1px ${themePalette.general.disabled}`,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: themePalette.general.cardBackgroundColor,
          // hide the first child element which is a divider with MuiDivider-root classname in MuiPaper
          '& > hr:first-child[class|="MuiDivider-root"]': {
            height: 0,
          },
        },
        elevation1: {
          boxShadow: 'none',
          borderRadius: '0',
          outline: `1px solid ${themePalette.general.cardBorderColor}`,
          '& > hr[class|="MuiDivider-root"]': {
            backgroundColor: themePalette.general.cardBorderColor,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
        rounded: {
          '&:first-child': {
            borderTopLeftRadius: '0',
            borderTopRightRadius: '0',
          },
          '&:last-child': {
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: themePalette.general.cardBackgroundColor,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          height: '100%',
          backgroundColor: themePalette.general.cardBackgroundColor,
          '& > div > div > h2[class*="makeStyles-label"]': {
            textTransform: 'unset',
            color: themePalette.general.cardSubtitleColor,
            opacity: '40%',
          },
          '& > div > div > p[class*="makeStyles-value"]': {
            fontWeight: 'normal',
          },
          '& > div > div > div[class*="MuiChip-sizeSmall"]': {
            backgroundColor: 'transparent',
            borderRadius: '8px',
            outline: `1px solid ${themePalette.general.disabled}`,
          },
          '& > div[class*="Mui-expanded"]': {
            margin: 'auto',
          },
          '& > div[class*="MuiAccordion-root"]:before': {
            height: 0,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&:autofill': {
            boxShadow: `0 0 0 100px ${themePalette.general.formControlBackgroundColor} inset`,
            borderRadius: 'unset',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: themePalette.general.disabled,
            opacity: 1,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:disabled': {
            color: themePalette.general.disabled,
          },
        },
      },
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
            boxShadow: `inset 0 0 0 1px ${themePalette.general.focusVisibleBorder}`,
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
            backgroundColor: themePalette.primary.dark,
            color: themePalette.primary.contrastText,
          },
          '&:disabled': {
            color: themePalette.general.disabled,
            backgroundColor: themePalette.general.disabledBackground,
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
            boxShadow: `inset 0 0 0 1px ${themePalette.general.focusVisibleBorder}`,
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
            backgroundColor: themePalette.secondary.dark,
            color: themePalette.secondary.contrastText,
          },
          '&:disabled': {
            color: themePalette.general.disabled,
            backgroundColor: themePalette.general.disabledBackground,
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
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
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
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
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
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
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
            outline: `${themePalette.general.focusVisibleBorder} solid 1px`,
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
    MuiCssBaseline: {
      styleOverrides: redhatFont,
    },
    MuiCardHeader: {
      styleOverrides: {
        content: {
          '& > span > nav span': {
            textTransform: 'unset',
            letterSpacing: 'normal',
            fountweight: 'normal',
          },
        },
        title: {
          fontSize: '1.125rem',
        },
        action: {
          '& > a > span > svg': {
            fontSize: '1.125rem',
          },
          '& > a[class*="MuiIconButton-root"]:hover': {
            color: themePalette.primary.textHover,
            backgroundColor: 'transparent',
          },
        },
      },
    },
  };
};
