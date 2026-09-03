import React, { useEffect, useContext } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSocket } from '../socket/SocketProvider';
import { useNotificationStore } from '../store/notification.store';
import { AuthContext } from '../context/AuthContext';

export const NotificationListener: React.FC = () => {
  const socket = useSocket();
  const { userToken } = useContext(AuthContext);
  const { fetchNotifications, handleNewRealtimeNotification } = useNotificationStore();

  // App State change listener (Foreground/Background)
  useEffect(() => {
    if (!userToken) return;

    // Initial fetch when authenticated
    fetchNotifications();

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
  }, [fetchNotifications, userToken]);

  // Socket new notification listener
  useEffect(() => {
    if (!socket || !userToken) return;

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
  }, [socket, userToken, handleNewRealtimeNotification]);

  return null; // This is a background listener component, renders nothing
};
