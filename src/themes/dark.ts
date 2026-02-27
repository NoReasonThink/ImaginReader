import { Theme } from './types';

export const DarkTheme: Theme = {
  id: 'dark',
  name: 'Default Dark',
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    info: '#64D2FF',

    headerBackground: '#1C1C1E',
    headerText: '#FFFFFF',

    buttonPrimaryBackground: '#0A84FF',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBackground: '#3A3A3C',
    buttonSecondaryText: '#0A84FF',

    cardBackground: '#1C1C1E',
    cardBorder: '#38383A',

    inputBackground: '#2C2C2E',
    inputText: '#FFFFFF',
    inputPlaceholder: '#636366',
    inputBorder: '#38383A',

    readerBackground: '#121212',
    readerText: '#E0E0E0',
    readerHighlight: '#FFD700',

    tocBackground: '#1C1C1E',
    tocText: '#FFFFFF',
    tocActiveBackground: '#2C2C2E',
    tocActiveText: '#0A84FF'
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32
  },
  typography: {
    fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24
    }
  }
};
