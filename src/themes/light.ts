import { Theme } from './types';

export const LightTheme: Theme = {
  id: 'light',
  name: 'Default Light',
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C7C7CC',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#5AC8FA',

    headerBackground: '#F8F8F8',
    headerText: '#000000',

    buttonPrimaryBackground: '#007AFF',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBackground: '#E5E5EA',
    buttonSecondaryText: '#007AFF',

    cardBackground: '#FFFFFF',
    cardBorder: '#E5E5EA',

    inputBackground: '#F2F2F7',
    inputText: '#000000',
    inputPlaceholder: '#C7C7CC',
    inputBorder: '#E5E5EA',

    readerBackground: '#FFFFFF',
    readerText: '#000000',
    readerHighlight: '#FFD700',

    tocBackground: '#FFFFFF',
    tocText: '#000000',
    tocActiveBackground: '#E5F1FF',
    tocActiveText: '#007AFF'
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
