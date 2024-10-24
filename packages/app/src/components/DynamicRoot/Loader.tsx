import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { useLoaderTheme } from '@redhat-developer/red-hat-developer-hub-theme';

const Loader = () => {
  // Access theme context before Backstage App is instantiated
  const theme = useLoaderTheme();

  return (
    <ThemeProvider theme={theme}>
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
