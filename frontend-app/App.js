import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { AuthProvider } from './src/lib/auth';
import { NotificationProvider } from './src/lib/notifications';
import RootNavigation from './src/navigation';

// Abaikan warning yang berisik
LogBox.ignoreLogs(['Call to function \\\'ExpoAsset.downloadAsync\\\' has been rejected']);

// Mencegah Blue Screen ("Something went wrong") ketika aplikasi berjalan dari cache
// dan gagal mendownload font (karena IP PC berubah / tidak dapat diakses).
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (error && error.message && error.message.includes('ExpoAsset.downloadAsync')) {
      console.warn('Network issue prevented asset download, ignoring to prevent blue screen:', error.message);
      return; // Jangan crash-kan aplikasi
    }
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer>
              <RootNavigation />
            </NavigationContainer>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
