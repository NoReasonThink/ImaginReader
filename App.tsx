import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BookshelfScreen from './src/screens/BookshelfScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
              headerStyle: { backgroundColor: '#fff' },
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
