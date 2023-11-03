import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 'calc(100vw - 16px)',
        height: 'calc(100vh - 16px)',
        backgroundColor: '#F8F8F8',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Loader;
