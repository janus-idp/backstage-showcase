export const defaultThemePalette = (mode: string) => {
  if (mode === 'dark') {
    return {
      primary: {
        main: '#1FA7F8', // text button color, button background color
        constainedButtonBackground: '#0066CC', // contained button background color
        textHover: '#73BCF7', // text button hover color
        contrastText: '#FFF', // contained button text color
        dark: '#004080', // contained button hover background color
        disabledBackground: '#444548', // contained button disabled background color
        disabled: '#AAABAC', // contained button disabled text color
      },
    };
  }
  return {
    primary: {
      main: '#0066CC',
      constainedButtonBackground: '#0066CC',
      mainHover: '#004080',
      contrastText: '#FFF',
      dark: '#004080',
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
    },
  };
};
