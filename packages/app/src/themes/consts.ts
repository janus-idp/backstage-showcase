export const pageFontFamily = 'RedHatText, helvetica, arial, sans-serif';
export const headerFontFamily = 'RedHatDisplay';
export const htmlFontSize = 16;
export const fontWeight: number = 400;
export const marginBottom: number = 8;

export const typography = {
  fontFamily: pageFontFamily,
  htmlFontSize,
  // Patternfly uses root em for these values but numbers are required, so using the pixel equivalent:
  h1: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom,
  },
  h2: {
    fontSize: 20,
    fontWeight,
    marginBottom,
  },
  h3: {
    fontSize: 18,
    fontWeight,
    marginBottom,
  },
  h4: {
    fontSize: 16,
    fontWeight,
    marginBottom,
  },
  h5: {
    fontSize: 16,
    fontWeight,
    marginBottom,
  },
  h6: {
    fontSize: 16,
    fontWeight,
    marginBottom,
  },
};
