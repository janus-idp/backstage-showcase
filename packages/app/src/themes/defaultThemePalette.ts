import { ThemeColors } from '../types/types';

export const defaultThemePalette = (mode: string, themeColors: ThemeColors) => {
  if (mode === 'dark') {
    return {
      general: {
        disabledBackground: '#444548',
        disabled: '#AAABAC',
        searchBarBorderColor: '#57585a',
        formControlBackgroundColor: '#36373A',
        mainSectionBackgroundColor: '#0f1214',
        headerBackgroundColor: '#0f1214',
        headerTextColor: '#FFF',
        cardBackgroundColor: '#212427',
        focusVisibleBorder: '#ADD6FF',
        sideBarBackgroundColor: '#1b1d21',
        cardSubtitleColor: '#FFF',
        cardBorderColor: '#444548',
        tableTitleColor: '#E0E0E0',
        tableSubtitleColor: '#E0E0E0',
        tableColumnTitleColor: '#E0E0E0',
        tableColumnTitleActiveColor: '#1FA7F8',
        tableRowHover: '#0f1214',
        tableBorderColor: '#515151',
        tableBackgroundColor: '#1b1d21',
        tabsBottomBorderColor: '#444548',
      },
      primary: {
        main: themeColors.primaryColor || '#1FA7F8', // text button color, button background color
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
      searchBarBorderColor: '#E4E4E4',
      focusVisibleBorder: '#0066CC',
      formControlBackgroundColor: '#FFF',
      mainSectionBackgroundColor: '#FFF',
      headerBackgroundColor: '#FFF',
      headerTextColor: '#151515',
      cardBackgroundColor: '#FFF',
      sideBarBackgroundColor: '#212427',
      cardSubtitleColor: '#000',
      cardBorderColor: '#EBEBEB',
      tableTitleColor: '#181818',
      tableSubtitleColor: '#616161',
      tableColumnTitleColor: '#151515',
      tableColumnTitleActiveColor: '#0066CC',
      tableRowHover: '#F5F5F5',
      tableBorderColor: '#E0E0E0',
      tableBackgroundColor: '#FFF',
      tabsBottomBorderColor: '#D2D2D2',
    },
    primary: {
      main: themeColors.primaryColor || '#0066CC',
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
