import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ViewDensity = 'compact' | 'comfortable' | 'cozy';
export type Theme = 'light' | 'dark' | 'auto';

interface SettingsState {
  // View preferences
  viewDensity: ViewDensity;
  theme: Theme;
  showCompletedTasks: boolean;

  // List view preferences
  listViewShowAllTasks: boolean; // Show tasks without dates in gantt

  // Actions
  setViewDensity: (density: ViewDensity) => void;
  setTheme: (theme: Theme) => void;
  setShowCompletedTasks: (show: boolean) => void;
  setListViewShowAllTasks: (show: boolean) => void;

  // Persistence
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const SETTINGS_STORAGE_KEY = '@FocusFlow:settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default values
  viewDensity: 'comfortable',
  theme: 'auto',
  showCompletedTasks: true,
  listViewShowAllTasks: true,

  setViewDensity: (density) => {
    set({ viewDensity: density });
    get().saveSettings();
  },

  setTheme: (theme) => {
    set({ theme });
    get().saveSettings();
  },

  setShowCompletedTasks: (show) => {
    set({ showCompletedTasks: show });
    get().saveSettings();
  },

  setListViewShowAllTasks: (show) => {
    set({ listViewShowAllTasks: show });
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          viewDensity: parsed.viewDensity || 'comfortable',
          theme: parsed.theme || 'auto',
          showCompletedTasks: parsed.showCompletedTasks ?? true,
          listViewShowAllTasks: parsed.listViewShowAllTasks ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const state = get();
      const data = JSON.stringify({
        viewDensity: state.viewDensity,
        theme: state.theme,
        showCompletedTasks: state.showCompletedTasks,
        listViewShowAllTasks: state.listViewShowAllTasks,
      });
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));
