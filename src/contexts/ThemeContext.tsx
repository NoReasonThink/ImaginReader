import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, Themes, ThemeType } from '../themes';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (type: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && Object.keys(Themes).includes(storedTheme)) {
        setThemeType(storedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const handleSetTheme = async (type: ThemeType) => {
    try {
      setThemeType(type);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, type);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = Themes[themeType];
  const isDark = themeType === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, themeType, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
