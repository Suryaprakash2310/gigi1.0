import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItemType } from '../api/notification.api';
import { theme } from '../theme/theme';

const { primary } = theme.colors;
const gray = '#666';
const black = '#333';
const lightGray = theme.colors.line;

interface Props {
  notification: NotificationItemType;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Format as Today 12:30 PM, Yesterday, or Date.
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const NotificationItemRaw: React.FC<Props> = ({ notification }) => {
  return (
    <View style={[styles.container, !notification.read && styles.unreadContainer]}>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications-outline" size={24} color={primary} />
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.timestamp}>{formatTime(notification.createdAt)}</Text>
      </View>
    </View>
  );
};

export const NotificationItem = memo(NotificationItemRaw);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: lightGray,
    alignItems: 'center',
  },
  unreadContainer: {
    backgroundColor: '#F9FAFE', // Light blue/gray tint to indicate new
  },
  iconContainer: {
    marginRight: 16,
    position: 'relative',
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: black,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: gray,
    marginBottom: 6,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: gray,
    fontWeight: '500',
  },
});
