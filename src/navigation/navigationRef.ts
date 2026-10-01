import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

/** The app's one NavigationContainer, for the few moves that happen
 * outside any screen (see RootNavigator's sign-out handling). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
