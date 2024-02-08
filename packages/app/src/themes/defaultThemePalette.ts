export const defaultThemePalette = (mode: string) => {
  if (mode === 'dark') {
    return {
      primary: {
        main: '#1FA7F8', // text button color, button background color
        mainHover: '#73BCF7', // text button hover color
        contrastText: '#FFF', // button text color
        dark: '#0066CC', // button hover background color
        disabledBackground: '#444548',
        disabled: '#AAABAC',
      },
    };
  }
  return {
    primary: {
      main: '#0066CC',
      mainHover: '#004080',
      contrastText: '#FFF',
      dark: '#004080',
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
    },
  };
};
