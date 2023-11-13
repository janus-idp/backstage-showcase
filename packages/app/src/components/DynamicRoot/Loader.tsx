import React, { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { customDarkTheme } from '../../themes/darkTheme';
import { customLightTheme } from '../../themes/lightTheme';

const themeLight = createTheme({
  palette: customLightTheme({}).getTheme('v5')?.palette,
});

const themeDark = createTheme({
  palette: customDarkTheme({}).getTheme('v5')?.palette,
});

const Loader = () => {
  // Hack access theme context before Backstage App is even instantiated
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(prevTheme => localStorage.getItem('theme') || prevTheme);
  }, [theme]);

  return (
    <ThemeProvider theme={theme === 'dark' ? themeDark : themeLight}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    </ThemeProvider>
  );
};

export default Loader;
