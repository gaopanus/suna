import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from './themeStore'; // Adjust path as needed
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


// Mock Vuetify's useTheme composable
// This is crucial because the store internally calls useVuetifyTheme()
const mockVuetifyThemeInstance = {
  global: {
    name: { value: 'myCustomLightTheme' }, // Initial theme name for the mock
    themes: { // Mock available themes in Vuetify
        value: {
            myCustomLightTheme: { dark: false, colors: {} },
            dark: { dark: true, colors: {} },
        }
    }
  },
};
vi.mock('vuetify', async (importOriginal) => {
    const actual = await importOriginal(); // Import actual Vuetify to get other exports if needed
    return {
        ...actual,
        useTheme: vi.fn(() => mockVuetifyThemeInstance), // Mock useTheme to return our controlled instance
    };
});


describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset mocks before each test
    localStorageMock.clear();
    vi.clearAllMocks(); // Clear all vi mocks, including useTheme
    // Reset the mock Vuetify theme state if it's changed by tests
    mockVuetifyThemeInstance.global.name.value = 'myCustomLightTheme';
  });

  afterEach(() => {
      localStorageMock.clear(); // Ensure clean slate for next test file if any
  });

  it('initializes with default theme if no localStorage preference', () => {
    const themeStore = useThemeStore(); // Store reads localStorage in its definition
    // applyInitialTheme syncs this state with Vuetify's theme system
    themeStore.applyInitialTheme();

    expect(themeStore.currentThemeName).toBe('myCustomLightTheme');
    expect(themeStore.isDarkMode).toBe(false);
    // Check if Vuetify's theme was actually set by applyInitialTheme
    expect(mockVuetifyThemeInstance.global.name.value).toBe('myCustomLightTheme');
  });

  it('initializes from localStorage if theme is set there', () => {
    localStorageMock.setItem('app_theme_preference', 'dark');
    const themeStore = useThemeStore(); // Reads 'dark' from localStorage
    themeStore.applyInitialTheme();

    expect(themeStore.currentThemeName).toBe('dark');
    expect(themeStore.isDarkMode).toBe(true);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('dark');
  });

  it('initializes with default theme if localStorage has an unknown theme', () => {
    localStorageMock.setItem('app_theme_preference', 'unknownTheme');
    const themeStore = useThemeStore();
    themeStore.applyInitialTheme();

    expect(themeStore.currentThemeName).toBe('myCustomLightTheme'); // Falls back to default
    expect(themeStore.isDarkMode).toBe(false);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('myCustomLightTheme');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app_theme_preference', 'myCustomLightTheme'); // Ensures it corrects localStorage
  });


  it('setTheme changes the theme and updates localStorage', () => {
    const themeStore = useThemeStore();
    themeStore.applyInitialTheme(); // Initial setup

    themeStore.setTheme('dark');
    expect(themeStore.currentThemeName).toBe('dark');
    expect(themeStore.isDarkMode).toBe(true);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('dark'); // Check Vuetify mock
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app_theme_preference', 'dark');

    themeStore.setTheme('myCustomLightTheme');
    expect(themeStore.currentThemeName).toBe('myCustomLightTheme');
    expect(themeStore.isDarkMode).toBe(false);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('myCustomLightTheme');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app_theme_preference', 'myCustomLightTheme');
  });

  it('setTheme does not change to an unknown theme', () => {
    const themeStore = useThemeStore();
    themeStore.applyInitialTheme(); // Initial theme is myCustomLightTheme

    themeStore.setTheme('unknownPurpleTheme');
    // Theme should not change from the initial one
    expect(themeStore.currentThemeName).toBe('myCustomLightTheme');
    expect(themeStore.isDarkMode).toBe(false);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('myCustomLightTheme');
    // localStorage should not have been called with 'unknownPurpleTheme'
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('app_theme_preference', 'unknownPurpleTheme');
  });


  it('toggleTheme switches between dark and light themes', () => {
    const themeStore = useThemeStore();
    themeStore.applyInitialTheme(); // Starts with myCustomLightTheme

    // Toggle 1: -> dark
    themeStore.toggleTheme();
    expect(themeStore.currentThemeName).toBe('dark');
    expect(themeStore.isDarkMode).toBe(true);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app_theme_preference', 'dark');

    // Toggle 2: -> myCustomLightTheme
    themeStore.toggleTheme();
    expect(themeStore.currentThemeName).toBe('myCustomLightTheme');
    expect(themeStore.isDarkMode).toBe(false);
    expect(mockVuetifyThemeInstance.global.name.value).toBe('myCustomLightTheme');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app_theme_preference', 'myCustomLightTheme');
  });

  it('isDarkMode getter reacts to currentThemeName changes', () => {
    const themeStore = useThemeStore();
    themeStore.applyInitialTheme();

    themeStore.currentThemeName = 'dark';
    expect(themeStore.isDarkMode).toBe(true);

    themeStore.currentThemeName = 'myCustomLightTheme';
    expect(themeStore.isDarkMode).toBe(false);
  });
});
