import apiClient from './client';

export interface NotificationItemType {
  _id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GetNotificationsResponse {
  notifications: NotificationItemType[];
  unreadCount: number;
}

/**
 * Fetches notifications and unread count for the Servicer
 */
export const getServicerNotifications = async (
  page: number = 1,
  limit: number = 20,
): Promise<GetNotificationsResponse> => {
  try {
    const response = await apiClient.get<GetNotificationsResponse>('/notifications/servicer', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching servicer notifications:', error);
    throw error;
  }
};

/**
 * Marks all notifications as read for the Servicer
 */
export const markServicerNotificationsRead = async (): Promise<void> => {
  try {
    await apiClient.put('/notifications/servicer/read');
  } catch (error) {
    console.error('Error marking servicer notifications as read:', error);
    throw error;
  }
};
