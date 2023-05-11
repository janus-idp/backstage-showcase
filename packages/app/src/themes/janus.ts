import {
  BackstageTheme,
  createTheme,
  genPageTheme,
  lightTheme,
  shapes,
} from '@backstage/theme';

const redhatFont = {
  fontFamily: 'Red Hat Font',
  fontStyle: 'normal',
  fontDisplay: 'swap',
  fontWeight: 400,
  src: `
    url(/fonts/RedHatText-Regular.woff2) format('woff2'),
    url(/fonts/RedHatText-Regular.otf) format('opentype'),
    url(/fonts/RedHatText-Regular.ttf) format('truetype')
  `,
};

const baseTheme = createTheme({
  fontFamily: '"Red Hat Font", Arial',
  palette: {
    ...lightTheme.palette,
    navigation: {
      background: '#222427',
      indicator: '#009596',
      color: '#ffffff',
      selectedColor: '#ffffff',
      navItem: {
        hoverBackground: '#4f5255',
      },
    },
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
    app: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
    apis: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
    documentation: genPageTheme({
      colors: ['#005f60', '#73c5c5'],
      shape: shapes.wave,
    }),
    tool: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.round }),
    other: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
  },
});

// @ts-ignore
export const janusTheme: BackstageTheme = {
  ...baseTheme,
  overrides: {
    ...baseTheme.overrides,
    MuiCssBaseline: {
      '@global': {
        '@font-face': [redhatFont],
      },
    },
  },
};
