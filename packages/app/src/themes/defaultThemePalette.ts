export const defaultThemePalette = (mode: string) => {
  if (mode === 'dark') {
    return {
      general: {
        disabledBackground: '#444548',
        disabled: '#AAABAC',
        formControlBackgroundColor: '#36373A',
        mainSectionBackgroundColor: '#0f1214',
        cardBackgroundColor: '#212427',
        focusVisibleBorder: '#ADD6FF',
        sideBarBackgroundColor: '#1b1d21',
        cardSubtitleColor: '#FFF',
        cardBorderColor: '#444548',
      },
      primary: {
        main: '#1FA7F8', // text button color, button background color
        containedButtonBackground: '#0066CC', // contained button background color
        textHover: '#73BCF7', // text button hover color
        contrastText: '#FFF', // contained button text color
        dark: '#004080', // contained button hover background color
      },
      secondary: {
        main: '#B2A3FF',
        containedButtonBackground: '#8476D1',
        textHover: '#CBC1FF',
        contrastText: '#FFF',
        dark: '#6753AC',
      },
    };
  }
  return {
    general: {
      disabledBackground: '#D2D2D2',
      disabled: '#6A6E73',
      focusVisibleBorder: '#0066CC',
      formControlBackgroundColor: '#FFF',
      mainSectionBackgroundColor: '#f0f0f0',
      cardBackgroundColor: '#FFF',
      sideBarBackgroundColor: '#212427',
      cardSubtitleColor: '#000',
      cardBorderColor: '#EBEBEB',
    },
    primary: {
      main: '#0066CC',
      containedButtonBackground: '#0066CC',
      mainHover: '#004080',
      contrastText: '#FFF',
      dark: '#004080',
    },
    secondary: {
      main: '#8476D1',
      containedButtonBackground: '#8476D1',
      mainHover: '#6753AC',
      contrastText: '#FFF',
      dark: '#6753AC',
    },
  };
};
