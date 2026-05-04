import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up handling behaviour for incoming notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPushNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return false;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

export async function getPushToken() {
  const hasPermission = await requestPushNotificationPermissions();
  if (!hasPermission) return null;

  try {
    // When not passing a projectId, Expo uses standard default
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.error('Error fetching Expo Push Token:', error);
    return null;
  }
}
