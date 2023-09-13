import { PageTheme, genPageTheme, shapes } from '@backstage/theme';

export const pageTheme: Record<string, PageTheme> = {
  home: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
  app: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
  apis: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
  documentation: genPageTheme({
    colors: ['#005f60', '#73c5c5'],
    shape: shapes.wave,
  }),
  tool: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.round }),
  other: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
};
