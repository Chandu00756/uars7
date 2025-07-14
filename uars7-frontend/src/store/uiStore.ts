import { create } from 'zustand';          // named import → correct type

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * Global UI store
 */
export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: true,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  themeMode: 'light',

  toggleTheme: () =>
    set((state) => ({
      themeMode: state.themeMode === 'light' ? 'dark' : 'light',
    })),
}));
