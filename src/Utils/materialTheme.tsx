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
            fontSize: '1.3rem', // Cambia este valor al tamaño que desees (ej: '14px', '1.2rem')
          },
        },
      },
    },
  },
  esES,
);
