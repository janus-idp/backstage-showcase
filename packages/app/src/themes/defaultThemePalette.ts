export const defaultThemePalette = (mode: string) => {
  if (mode === 'dark') {
    return {
      primary: {
        main: '#1FA7F8', // text button color, button background color
        containedButtonBackground: '#0066CC', // contained button background color
        textHover: '#73BCF7', // text button hover color
        contrastText: '#FFF', // contained button text color
        dark: '#004080', // contained button hover background color
        disabledBackground: '#444548', // contained button disabled background color
        disabled: '#AAABAC', // contained button disabled text color
        focusVisibleBorder: '#ADD6FF', // contained button focus color
      },
      secondary: {
        main: '#B2A3FF',
        containedButtonBackground: '#8476D1',
        textHover: '#CBC1FF',
        contrastText: '#FFF',
        dark: '#6753AC',
        disabledBackground: '#444548',
        disabled: '#AAABAC',
        focusVisibleBorder: '#ADD6FF',
      },
    };
  }
  return {
    primary: {
      main: '#0066CC',
      containedButtonBackground: '#0066CC',
      mainHover: '#004080',
      contrastText: '#FFF',
      dark: '#004080',
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
      focusVisibleBorder: '#0066CC',
    },
    secondary: {
      main: '#8476D1',
      containedButtonBackground: '#8476D1',
      mainHover: '#6753AC',
      contrastText: '#FFF',
      dark: '#6753AC',
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
      focusVisibleBorder: '#0066CC',
    },
  };
};
