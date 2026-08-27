import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
} from '@expo-google-fonts/barlow-condensed';
import RootNavigator from './src/navigation/RootNavigator';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { colors } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const s = useAppState();
  const ready = fontsLoaded && s.authStatus !== 'checking';

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayout}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_700Bold,
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppShell fontsLoaded={fontsLoaded} />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
