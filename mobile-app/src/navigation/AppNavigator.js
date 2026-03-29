import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import useAuthStore from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import PremiumScreen from '../screens/mobile/PremiumScreen';
import OnboardingScreen from '../screens/mobile/OnboardingScreen';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, restoreSession, user } = useAuthStore();
  const navigationRef = useRef(null);

  useEffect(() => {
    restoreSession();
  }, []);

  // Register push token and handle notification taps once authenticated
  usePushNotifications(
    isAuthenticated
      ? (screen) => {
          if (navigationRef.current) {
            const map = {
              Rutinas: 'Rutinas',
              Inicio: 'Inicio',
              Chat: 'Chat',
              Nutrición: 'Nutrición',
            };
            try { navigationRef.current.navigate(map[screen] || 'Inicio'); } catch {}
          }
        }
      : null
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const needsOnboarding = isAuthenticated && user && !user.onboardingCompleted;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}