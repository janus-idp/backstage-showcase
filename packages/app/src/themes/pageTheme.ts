import { PageTheme, genPageTheme, shapes } from '@backstage/theme';
import { ThemeColors } from '../types/types';

export const pageTheme = (input: ThemeColors): Record<string, PageTheme> => {
  const { headerColor1, headerColor2 } = input;
  const defaultColors = ['#005f60', '#73c5c5'];
  const headerColor = [
    headerColor1 || defaultColors[0],
    headerColor2 || defaultColors[1],
  ];
  return {
    home: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.round,
    }),
    other: genPageTheme({
      colors: [headerColor[0], headerColor[1]],
      shape: shapes.wave,
    }),
  };
};
