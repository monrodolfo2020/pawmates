import React, { useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import WalkerProfileScreen from '../screens/WalkerProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import LiveWalkScreen from '../screens/LiveWalkScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminScreen from '../screens/AdminScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import StoresScreen from '../screens/StoresScreen';
import StorefrontScreen from '../screens/StorefrontScreen';
import MyStoreScreen from '../screens/MyStoreScreen';
import OrdersScreen from '../screens/OrdersScreen';
import { useAppState } from '../state/AppState';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: { role?: 'owner' | 'provider' } | undefined;
  Onboarding: undefined;
  Home: undefined;
  WalkerProfile: { walkerId: string };
  Booking: { walkerId: string };
  Checkout: { walkerId: string };
  Live: { walkerId: string };
  Dashboard: undefined;
  Admin: undefined;
  Profile: undefined;
  Bookings: undefined;
  ComingSoon: { title: string };
  Stores: undefined;
  Storefront: { providerId: string };
  MyStore: undefined;
  Orders: { mode: 'purchases' | 'sales'; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const s = useAppState();

  // Auth state loads from AsyncStorage asynchronously (see AppState's
  // mount effect) — App.tsx keeps the splash screen up until this settles.
  if (s.authStatus === 'checking') return null;

  // React Navigation only reads `initialRouteName` when a Navigator is
  // first constructed — since this component returns the *same*
  // `<Stack.Navigator>` element type across the guest/authed branches,
  // React would normally just re-render it in place rather than
  // reconstructing it, so a role-dependent initialRouteName would never
  // actually take effect. The `key` below forces a real remount on that
  // one transition, and this ref freezes the decision made at that moment
  // (a provider-only account should never later get bounced to Onboarding
  // just because an owner role got added afterwards).
  const initialAuthedRoute = useRef<'Onboarding' | 'Home' | null>(null);

  if (s.authStatus !== 'authed') {
    initialAuthedRoute.current = null;
    return (
      <Stack.Navigator key="guest" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  if (initialAuthedRoute.current === null) {
    if (s.roles.includes('owner')) {
      // The pets list loads asynchronously right after login/signup — wait
      // for that first fetch to resolve rather than deciding while `pets`
      // still holds its empty initial value (that would send every owner,
      // including ones with existing pets, to Onboarding on every login).
      if (!s.petsChecked) return null;
      initialAuthedRoute.current = s.pets.length === 0 ? 'Onboarding' : 'Home';
    } else {
      // A provider-only account has no pets to check.
      initialAuthedRoute.current = 'Home';
    }
  }

  return (
    <Stack.Navigator
      key={`authed-${initialAuthedRoute.current}`}
      initialRouteName={initialAuthedRoute.current}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="WalkerProfile" component={WalkerProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Live" component={LiveWalkScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="Stores" component={StoresScreen} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} />
      <Stack.Screen name="MyStore" component={MyStoreScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  );
}
