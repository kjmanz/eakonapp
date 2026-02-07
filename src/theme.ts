import { createTheme } from '@mui/material/styles';

// テーマ作成 - 50代以上の利用を想定し、可読性と操作性を優先
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1658d1',
      light: '#2f6de0',
      dark: '#0f3f99',
    },
    secondary: {
      main: '#3f5066',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#172033',
      secondary: '#3f5066',
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      '"Hiragino Sans"',
      'Meiryo',
      '"Yu Gothic"',
      'sans-serif',
    ].join(','),
    fontSize: 16,
    h5: {
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 700,
      lineHeight: 1.45,
    },
    subtitle1: {
      fontSize: '1.05rem',
      lineHeight: 1.6,
    },
    subtitle2: {
      fontSize: '0.98rem',
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.7,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          letterSpacing: '0.01em',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          color: '#172033',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e5edf9',
          boxShadow: '0 6px 18px rgba(23, 32, 51, 0.05)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 44,
          fontWeight: 700,
          fontSize: '0.98rem',
          textTransform: 'none',
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 58,
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'none',
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          fontSize: '1rem',
          borderRadius: 10,
        },
        notchedOutline: {
          borderColor: '#c8d5ea',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.95rem',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontSize: '0.98rem',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          paddingTop: 18,
          paddingBottom: 18,
        },
        rail: {
          height: 6,
        },
        track: {
          height: 6,
        },
        thumb: {
          width: 20,
          height: 20,
        },
        valueLabel: {
          fontSize: '0.86rem',
          fontWeight: 700,
        },
        markLabel: {
          fontSize: '0.84rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.95rem',
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        label: {
          fontSize: '0.82rem',
          fontWeight: 700,
        },
      },
    },
  },
});
