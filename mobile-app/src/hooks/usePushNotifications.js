import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api/api.service';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push notification permissions, gets the Expo push token,
 * and registers it with the backend.
 *
 * @param {Function} onNotificationTap - Called with the notification data when user taps a notification
 */
export function usePushNotifications(onNotificationTap) {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    registerForPushNotifications();

    // Listener: notification received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Badge / UI update if needed
    });

    // Listener: user tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen && onNotificationTap) {
        onNotificationTap(data.screen, data);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    // Simulator — skip silently
    return;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Gym IA',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return; // User denied — respect their choice silently
  }

  try {
    const tokenOptions = {};
    if (process.env.EXPO_PUBLIC_PROJECT_ID) {
      tokenOptions.projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);
    const token = tokenData.data;

    // Register with backend (fire-and-forget)
    await api.post('/users/me/push-token', { token }).catch(() => null);
  } catch (err) {
    // In Expo Go without projectId this may fail — not critical for development
    console.log('[Push] Token registration failed:', err.message);
  }
}
