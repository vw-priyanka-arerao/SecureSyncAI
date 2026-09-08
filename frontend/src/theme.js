import { createTheme } from '@mui/material/styles';

const headingFont = ['VW Head', 'Segoe UI', 'Arial', 'sans-serif'].join(',');
const bodyFont = ['VW Text', 'Segoe UI', 'Arial', 'sans-serif'].join(',');

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#001e50',
      light: '#0040c5',
      dark: '#001638',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#002733',
      light: '#003d4d',
      dark: '#001f29',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#000000',
      secondary: '#555555'
    },
    info: {
      main: '#0040c5',
      contrastText: '#ffffff'
    },
    success: {
      main: '#00b140',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#b7791f',
      contrastText: '#ffffff'
    },
    error: {
      main: '#b00020',
      contrastText: '#ffffff'
    },
    divider: '#dddddd'
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: bodyFont,
    fontWeightMedium: 700,
    fontWeightBold: 700,
    h1: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    h2: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    h3: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    h4: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0, fontSize: '1.75rem' },
    h5: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0, fontSize: '1.35rem' },
    h6: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0, fontSize: '1.1rem' },
    subtitle1: { fontFamily: headingFont, fontWeight: 400 },
    subtitle2: { fontFamily: headingFont, fontWeight: 700 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0.1 },
    caption: { letterSpacing: 0 },
    overline: { fontFamily: headingFont, letterSpacing: 0.6 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: bodyFont
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #dddddd',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': { paddingBottom: 20 }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontFamily: headingFont,
          fontWeight: 700,
          paddingInline: 18
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid #dddddd',
          borderRadius: 8
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: headingFont,
          fontWeight: 700,
          fontSize: '1.15rem'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#002733',
          backgroundImage: 'none',
          borderBottom: '1px solid #003d4d',
          boxShadow: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #dddddd'
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: headingFont,
          fontWeight: 400
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          marginInline: 8,
          '&.Mui-selected': {
            backgroundColor: '#e6f0fa',
            '&:hover': { backgroundColor: '#d9e8f7' }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontFamily: headingFont,
          fontWeight: 700,
          letterSpacing: 0.2
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e5e5e5'
        },
        head: {
          backgroundColor: '#f2f2f2',
          color: '#333333',
          fontFamily: headingFont,
          fontWeight: 700,
          letterSpacing: 0.2,
          borderBottom: '1px solid #dddddd'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: bodyFont
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: headingFont,
          fontWeight: 700,
          textTransform: 'none'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: bodyFont
        }
      }
    }
  }
});

export default theme;

