import React, { useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
// Headline faces a business can choose for its own page (see pageFonts).
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
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
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    InstrumentSerif_400Regular,
    Nunito_800ExtraBold,
    PlayfairDisplay_700Bold,
    Caveat_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppShell fontsLoaded={fontsLoaded} />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
