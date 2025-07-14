import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  InputBase,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import { useUiStore } from '../store/uiStore';

export default function Header() {
  const { toggleSidebar, themeMode, toggleTheme } = useUiStore();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: (t) => alpha(t.palette.primary.main, 0.95),
        height: { xs: 56, md: 72 },
        justifyContent: 'center',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </IconButton>

        {/*   ====  Logo  ====   */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="6" fill="white" />
            <path
              d="M8 16L16 8L24 16L16 24L8 16Z"
              stroke="#29648E"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 700 }}>
            PortalVII
          </Typography>
        </Box>

        {/*   ====  Omni-Search  ====   */}
        <Box
          sx={{
            flex: 1,
            mx: 4,
            position: 'relative',
            maxWidth: 480,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <InputBase
            placeholder="Search services or capsules… ⌘ K"
            sx={(t) => ({
              width: '100%',
              color: 'inherit',
              borderRadius: 8,
              paddingLeft: 4,
              backgroundColor: alpha(t.palette.common.white, 0.15),
              '&:hover': { backgroundColor: alpha(t.palette.common.white, 0.25) },
              '.MuiInputBase-input': { py: 1.2 },
            })}
            startAdornment={
              <SearchIcon
                sx={{ position: 'absolute', left: 12, top: '50%', translate: '0 -50%' }}
              />
            }
            inputProps={{ 'aria-label': 'Search' }}
          />
        </Box>

        {/*   ====  Actions  ====   */}
        <IconButton color="inherit" onClick={toggleTheme}>
          {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <IconButton color="inherit" aria-label="Notifications">
          <NotificationsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
