import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BookshelfScreen from './src/screens/BookshelfScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import { RootStackParamList } from './src/types';
import { ThemeProvider, LanguageProvider, useTheme } from './src/contexts';
import { VideoGenerationService } from './src/services/VideoGenerationService';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppContent = () => {
  const { theme, isDark } = useTheme();

  React.useEffect(() => {
    VideoGenerationService.resumePendingTasks();
  }, []);

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.headerBackground,
      text: theme.colors.headerText,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Bookshelf">
        <Stack.Screen 
          name="Bookshelf" 
          component={BookshelfScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Reader" 
          component={ReaderScreen}
          options={{
            headerStyle: { backgroundColor: theme.colors.headerBackground },
            headerTintColor: theme.colors.headerText,
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
