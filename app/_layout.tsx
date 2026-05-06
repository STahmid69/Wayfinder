import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ConvoyProvider } from '../contexts/ConvoyContext';

function InitialLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ConvoyProvider>
          <InitialLayout />
        </ConvoyProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
