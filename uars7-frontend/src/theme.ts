import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    sand: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    sand?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#29648E',
      dark: '#1E4867',
      light: '#5B91B6',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#178582',
      contrastText: '#FFFFFF'
    },
    accent: {
      main: '#FF7F50',
      contrastText: '#FFFFFF'
    },
    sand: {
      main: '#BFA181',
      contrastText: '#0E1A24'
    },
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#0E1A24',
      secondary: alpha('#0E1A24', 0.65)
    }
  },
  typography: {
    fontFamily: `'Inter','Mont',sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '-.03em' },
    h2: { fontWeight: 700, letterSpacing: '-.02em' },
    h3: { fontWeight: 700, letterSpacing: '-.02em' },
    body1: { fontWeight: 400, lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { fontSize: '0.78rem' }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 24, paddingBlock: 10 }
      }
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 14 } }
    }
  }
});

export default theme;
