import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateServicerFcmToken, updateUserFcmToken } from '../api/notification.api';
import { UserRole } from './enums/CommonEnum';

const LAST_FCM_TOKEN_KEY = 'last_registered_fcm_token';
let cachedFcmToken: string | null = null;
let isRegistering = false;

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

/**
 * Request notification permissions and create Android notification channels
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Urgent Booking Alerts channel
      await Notifications.setNotificationChannelAsync('booking_alerts', {
        name: 'Booking Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#00C853',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
  } catch (err) {
    console.error('Error requesting push notification permissions:', err);
    return false;
  }
}

/**
 * Retrieves the device FCM push token (or Expo fallback)
 */
export async function getDeviceFcmToken(): Promise<string | null> {
  if (cachedFcmToken) {
    return cachedFcmToken;
  }

  const hasPermission = await requestPushNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    if (tokenData && tokenData.data) {
      cachedFcmToken = tokenData.data;
      return cachedFcmToken;
    }
  } catch (deviceTokenErr) {
    // Fallback to Expo push token
  }

  try {
    const expoTokenData = await Notifications.getExpoPushTokenAsync();
    if (expoTokenData && expoTokenData.data) {
      cachedFcmToken = expoTokenData.data;
      return cachedFcmToken;
    }
  } catch (expoTokenErr) {
    // Ignore expo token error
  }

  return null;
}

let lastAttemptTime = 0;
const REGISTRATION_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Synchronizes a specific token with the backend with strict concurrency protection
 */
export async function syncTokenWithBackend(
  token: string,
  role?: string | null,
  force: boolean = false,
): Promise<boolean> {
  if (!token || isRegistering) {
    return false;
  }

  const now = Date.now();
  if (!force && now - lastAttemptTime < REGISTRATION_COOLDOWN_MS && !cachedFcmToken) {
    return false;
  }

  try {
    const lastToken = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);
    if (!force && lastToken === token) {
      cachedFcmToken = token;
      return true;
    }

    isRegistering = true;
    lastAttemptTime = Date.now();

    if ((role as any) === 'USER') {
      await updateUserFcmToken(token);
    } else {
      await updateServicerFcmToken(token);
    }

    cachedFcmToken = token;
    await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, token);
    return true;
  } catch (error) {
    return false;
  } finally {
    isRegistering = false;
  }
}

/**
 * Registers the device FCM token with the backend API
 * @param role Optional user role (e.g. SingleEmployee, MultiEmployee, ToolShop, User)
 */
export async function registerPushTokenWithBackend(
  role?: string | null,
  force: boolean = false,
): Promise<string | null> {
  if (isRegistering) return null;

  try {
    const token = await getDeviceFcmToken();
    if (!token) {
      return null;
    }

    await syncTokenWithBackend(token, role, force);
    return token;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return null;
  }
}

export async function clearRegisteredPushToken(): Promise<void> {
  try {
    cachedFcmToken = null;
    await AsyncStorage.removeItem(LAST_FCM_TOKEN_KEY);
  } catch (err) {
    console.error('Error clearing registered push token:', err);
  }
}

// Alias for backward compatibility
export const getPushToken = getDeviceFcmToken;

