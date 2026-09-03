import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  getServicerNotifications,
  markServicerNotificationsRead,
  NotificationItemType,
} from '../api/notification.api';

interface NotificationState {
  notifications: NotificationItemType[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: () => Promise<void>;
  handleNewRealtimeNotification: (newNotification: NotificationItemType) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (page = 1, limit = 20) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        set({ loading: false });
        return;
      }

      set({ loading: true, error: null });
      const data = await getServicerNotifications(page, limit);
      
      set((state) => {
        // Simple deduplication strategy based on _id
        const newNotifications = page === 1 
          ? data.notifications 
          : [...state.notifications, ...data.notifications];
          
        const uniqueNotifications = Array.from(
          new Map(newNotifications.map((item) => [item._id, item])).values()
        );

        return {
          notifications: uniqueNotifications,
          unreadCount: data.unreadCount,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch notifications', 
        loading: false 
      });
    }
  },

  markAsRead: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Optimistically update UI
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
      
      await markServicerNotificationsRead();
    } catch (error: any) {
      console.error('Failed to mark notifications as read:', error);
      // Re-fetch to restore accurate state on failure
      get().fetchNotifications();
    }
  },

  handleNewRealtimeNotification: (newNotification: NotificationItemType) => {
    set((state) => {
      // Deduplicate before prepending
      if (state.notifications.some((n) => n._id === newNotification._id)) {
        return state;
      }
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },
}));
