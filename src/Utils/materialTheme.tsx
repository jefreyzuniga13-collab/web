import { createTheme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';

export const theme = createTheme(
  {
    palette: {
      primary: { main: '#1976d2' },
    },
    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '1.5rem',
          },
        },
      },
       MuiTypography: {
        defaultProps: {
          fontSize: '1.5rem', 
        },
    },
    },
  },
  esES,
);
