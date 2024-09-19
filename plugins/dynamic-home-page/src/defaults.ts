export type Breakpoints = 'xl' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

// prettier-ignore
export const commonWidths: Record<string, Record<Breakpoints, number>> = {
  small: { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  half:  { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '1/2': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '1/3': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  '2/2': { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
  full:  { xl: 2, lg: 2, md: 2, sm: 3, xs: 4, xxs: 2 },
};

// prettier-ignore
export const commonHeights: Record<string, Record<Breakpoints, number>> = {
  tiny:     { xl: 1, lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 },
  small:    { xl: 2, lg: 2, md: 2, sm: 2, xs: 2, xxs: 2 },
  medium:   { xl: 4, lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 },
  large:    { xl: 6, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
  xlarge:   { xl: 10, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
  xxlarge:  { xl: 14, lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 },
};
