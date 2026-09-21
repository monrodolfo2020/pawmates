import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SignupScreen from '../screens/SignupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import BusinessProfileScreen from '../screens/BusinessProfileScreen';
import MicrositeScreen from '../screens/MicrositeScreen';
import MyPageScreen from '../screens/MyPageScreen';
import MeetGreetScreen from '../screens/MeetGreetScreen';
import BookingScreen from '../screens/BookingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import LiveWalkScreen from '../screens/LiveWalkScreen';
import ChatScreen from '../screens/ChatScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminScreen from '../screens/AdminScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import ProviderProfileEditScreen from '../screens/ProviderProfileEditScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import { useAppState } from '../state/AppState';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Signup: { role?: 'owner' | 'provider' } | undefined;
  Onboarding: { petId?: string } | undefined;
  Home: undefined;
  Business: { providerId: string };
  Microsite: { slug: string };
  MyPage: undefined;
  MeetGreet: { walkerId: string };
  Booking: { walkerId: string };
  Checkout: { walkerId: string };
  Live: { walkerId: string };
  Chat: { bookingId: string };
  Dashboard: undefined;
  Admin: undefined;
  Profile: undefined;
  Bookings: undefined;
  ComingSoon: { title: string };
  AdminLogin: undefined;
  ProviderProfileEdit: undefined;
  VerifyEmail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// True when the browser's URL is (a path ending in) /admin — the GitHub
// Pages base path (see deploy-pages.yml) puts a repo-name segment in
// front, so this checks the suffix rather than an exact path.
function isAdminGatePath(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return /\/admin\/?$/.test(window.location.pathname);
}

// Same idea as isAdminGatePath — /reset-password?token=... is a standalone
// entry point from the emailed link, independent of whatever session (if
// any) already exists in this browser, so it's checked before the normal
// guest/authed branching and regardless of authStatus.
function getResetPasswordToken(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!/\/reset-password\/?$/.test(window.location.pathname)) return null;
  return new URLSearchParams(window.location.search).get('token');
}

/**
 * /s/<slug> — a business's shareable micro-page. Another standalone
 * gate: whoever opens the link a business shared is usually a stranger
 * with no account, and if they *do* happen to be signed in, they should
 * still land on the page they clicked rather than their own home screen.
 */
function getMicrositeSlug(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return /\/s\/([^/?#]+)\/?$/.exec(window.location.pathname)?.[1] ?? null;
}

export default function RootNavigator() {
  const s = useAppState();

  // Auth state loads from AsyncStorage asynchronously (see AppState's
  // mount effect) — App.tsx keeps the splash screen up until this settles.
  if (s.authStatus === 'checking') return null;

  // Checked before authStatus even matters — see getResetPasswordToken's
  // comment.
  const resetPasswordToken = getResetPasswordToken();
  if (resetPasswordToken) {
    return (
      <Stack.Navigator key="reset-password-gate" screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          initialParams={{ token: resetPasswordToken }}
        />
      </Stack.Navigator>
    );
  }

  const micrositeSlug = getMicrositeSlug();
  if (micrositeSlug) {
    return (
      <Stack.Navigator key="microsite-gate" screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Microsite"
          component={MicrositeScreen}
          initialParams={{ slug: micrositeSlug }}
        />
      </Stack.Navigator>
    );
  }

  // /admin is a standalone gate that bypasses Welcome/Login entirely —
  // one password field, checked before the normal guest/authed branching
  // below so it works on a hard page load, not just in-app navigation.
  // Once it succeeds, authStatus flips to 'authed' and this stops
  // matching, falling through to the normal authed stack below.
  if (s.authStatus !== 'authed' && isAdminGatePath()) {
    return (
      <Stack.Navigator key="admin-gate" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      </Stack.Navigator>
    );
  }

  // React Navigation only reads `initialRouteName` when a Navigator is
  // first constructed — since this component returns the *same*
  // `<Stack.Navigator>` element type across the guest/authed branches,
  // React would normally just re-render it in place rather than
  // reconstructing it, so a role-dependent initialRouteName would never
  // actually take effect. The `key` below forces a real remount on that
  // one transition, and this ref freezes the decision made at that moment
  // (a provider-only account should never later get bounced to Onboarding
  // just because an owner role got added afterwards).
  const initialAuthedRoute = useRef<'Onboarding' | 'Home' | 'Dashboard' | 'VerifyEmail' | null>(null);

  if (s.authStatus !== 'authed') {
    initialAuthedRoute.current = null;
    return (
      <Stack.Navigator key="guest" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Business" component={BusinessProfileScreen} />
      </Stack.Navigator>
    );
  }

  if (initialAuthedRoute.current === null) {
    // Admin accounts skip the forced pet-onboarding flow even if they also
    // hold the owner role — Onboarding has no back/skip button, so an
    // admin with zero pets would otherwise be stuck there with no way to
    // reach the admin panel.
    if (s.roles.includes('owner') && !s.roles.includes('admin')) {
      // The pets list loads asynchronously right after login/signup — wait
      // for that first fetch to resolve rather than deciding while `pets`
      // still holds its empty initial value (that would send every owner,
      // including ones with existing pets, to Onboarding on every login).
      if (!s.petsChecked) return null;
      initialAuthedRoute.current = s.pets.length === 0 ? 'Onboarding' : 'Home';
    } else if (s.roles.includes('provider') && !s.roles.includes('admin')) {
      // A business account lands on its own Panel, not on Home — Home is
      // the customer-facing services directory, and a business that had
      // just signed up used to see its own (empty) directory as if it
      // were a customer looking for itself.
      // An unverified email additionally routes through VerifyEmail first
      // (see that screen's comment on why it's a nudge, not a hard gate —
      // "Omitir por ahora" always works).
      initialAuthedRoute.current = s.emailVerified ? 'Dashboard' : 'VerifyEmail';
    } else {
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
      <Stack.Screen name="Business" component={BusinessProfileScreen} />
      <Stack.Screen name="MyPage" component={MyPageScreen} />
      <Stack.Screen name="MeetGreet" component={MeetGreetScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Live" component={LiveWalkScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ProviderProfileEdit" component={ProviderProfileEditScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}
