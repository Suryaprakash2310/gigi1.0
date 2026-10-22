import React, { useEffect, useContext, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSocket } from '../socket/SocketProvider';
import { useNotificationStore } from '../store/notification.store';
import { AuthContext } from '../context/AuthContext';
import { registerPushTokenWithBackend, syncTokenWithBackend } from '../utils/notification.utils';

export const NotificationListener: React.FC = () => {
  const socket = useSocket();
  const { userToken, userRole } = useContext(AuthContext);
  const { fetchNotifications, handleNewRealtimeNotification } = useNotificationStore();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const tokenRefreshListener = useRef<Notifications.Subscription | null>(null);

  // 1. FCM Token Registration on Authentication
  useEffect(() => {
    if (!userToken) return;

    let isMounted = true;

    // Register push token with backend on auth
    registerPushTokenWithBackend(userRole).catch((err) => {
      console.error('Error registering FCM token:', err);
    });

    // Listen for FCM token refreshes (without calling getDeviceFcmToken again)
    tokenRefreshListener.current = Notifications.addPushTokenListener((tokenData) => {
      if (!isMounted || !tokenData?.data) return;
      syncTokenWithBackend(tokenData.data, userRole, false).catch(() => {});
    });

    return () => {
      isMounted = false;
      if (tokenRefreshListener.current) {
        tokenRefreshListener.current.remove();
      }
    };
  }, [userToken, userRole]);

  // 2. App State change listener (Foreground/Background)
  useEffect(() => {
    if (!userToken) return;

    // Initial fetch when authenticated
    fetchNotifications();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to foreground, refetch notification list
        fetchNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications, userToken]);

  // 3. Native Push Notification Receivers (Foreground & Interaction)
  useEffect(() => {
    if (!userToken) return;

    // Triggered when a push notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data) {
        handleNewRealtimeNotification({
          _id: String((data as any).notificationId || Date.now()),
          title: notification.request.content.title || 'New Notification',
          message: notification.request.content.body || '',
          type: String((data as any).type || 'SYSTEM'),
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Triggered when a user taps on or interacts with a push notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.bookingId) {
        // Handle booking tap
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userToken, handleNewRealtimeNotification]);

  // 4. Socket new notification listener
  useEffect(() => {
    if (!socket || !userToken) return;

    const onNewNotification = (data: any) => {
      handleNewRealtimeNotification(data);
    };

    socket.on('new_notification', onNewNotification);

    return () => {
      socket.off('new_notification', onNewNotification);
    };
  }, [socket, userToken, handleNewRealtimeNotification]);

  return null; // This is a background listener component, renders nothing
};
