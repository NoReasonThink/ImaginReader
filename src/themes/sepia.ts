import { Theme } from './types';

export const SepiaTheme: Theme = {
  id: 'sepia',
  name: 'Sepia Reader',
  colors: {
    primary: '#A0522D',
    secondary: '#8B4513',
    background: '#F4ECD8',
    surface: '#EAE0C8',
    text: '#5B4636',
    textSecondary: '#8B735B',
    border: '#D2C4A7',
    success: '#6B8E23',
    error: '#CD5C5C',
    warning: '#D2691E',
    info: '#4682B4',

    headerBackground: '#E6DCC3',
    headerText: '#5B4636',

    buttonPrimaryBackground: '#8B4513',
    buttonPrimaryText: '#F4ECD8',
    buttonSecondaryBackground: '#E0D4B8',
    buttonSecondaryText: '#5B4636',

    cardBackground: '#FDF6E3',
    cardBorder: '#D2C4A7',

    inputBackground: '#EAE0C8',
    inputText: '#5B4636',
    inputPlaceholder: '#A89F91',
    inputBorder: '#D2C4A7',

    readerBackground: '#F4ECD8',
    readerText: '#5B4636',
    readerHighlight: '#FFD700',

    tocBackground: '#F4ECD8',
    tocText: '#5B4636',
    tocActiveBackground: '#E6DCC3',
    tocActiveText: '#8B4513'
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32
  },
  typography: {
    fontFamily: '"Merriweather", "Georgia", serif',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24
    }
  }
};
