export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Specific component colors
  headerBackground: string;
  headerText: string;
  
  buttonPrimaryBackground: string;
  buttonPrimaryText: string;
  buttonSecondaryBackground: string;
  buttonSecondaryText: string;
  
  cardBackground: string;
  cardBorder: string;
  
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  
  // Reader specific
  readerBackground: string;
  readerText: string;
  readerHighlight: string;
  
  tocBackground: string;
  tocText: string;
  tocActiveBackground: string;
  tocActiveText: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  spacing: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
  };
}
