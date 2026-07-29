import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import WalkerProfileScreen from '../screens/WalkerProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import LiveWalkScreen from '../screens/LiveWalkScreen';
import DashboardScreen from '../screens/DashboardScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  WalkerProfile: { walkerId: string };
  Booking: { walkerId: string };
  Checkout: { walkerId: string };
  Live: { walkerId: string };
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="WalkerProfile" component={WalkerProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Live" component={LiveWalkScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
