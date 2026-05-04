import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSocket } from '../socket/SocketProvider';
import { useNotificationStore } from '../store/notification.store';
import { Ionicons } from '@expo/vector-icons';
// Optional: import { useToast } from 'some-toast-lib'; if available.

export const NotificationListener: React.FC = () => {
  const socket = useSocket();
  const { fetchNotifications, handleNewRealtimeNotification } = useNotificationStore();

  // App State change listener (Foreground/Background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to foreground, refetch notifications
        fetchNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  // Socket new notification listener
  useEffect(() => {
    if (!socket) return;

    const onNewNotification = (data: any) => {
      console.log('🔔 New real-time notification received:', data);
      
      handleNewRealtimeNotification(data);
      
      // Ideally trigger an In-app Toast / banner here
      // Toast.show({ type: 'success', text1: data.title, text2: data.message });
    };

    socket.on('new_notification', onNewNotification);

    return () => {
      socket.off('new_notification', onNewNotification);
    };
  }, [socket, handleNewRealtimeNotification]);

  return null; // This is a background listener component, renders nothing
};
