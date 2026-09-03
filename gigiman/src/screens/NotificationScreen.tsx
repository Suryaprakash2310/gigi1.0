import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNotificationStore } from '../store/notification.store';
import { NotificationItem } from '../components/NotificationItem';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import AppHeader from '@/components/AppHeader';
import { useNavigation } from '@react-navigation/native';

const { primary } = theme.colors;
const gray = '#666';
const lightGray = theme.colors.line;

export default function NotificationScreen() {
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead
  } = useNotificationStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Initial fetch when mounting
    fetchNotifications();

    // Setup an interval to ensure 'mark as read' is called if unread items remain,
    // Or just call it directly since we just fetched. However, since fetch is async,
    // it's safer to mark as read directly on mount. The API processes PUT.
    const markReadTimer = setTimeout(() => {
      markAsRead();
    }, 1500); // slight delay so unread UI flashes first

    return () => clearTimeout(markReadTimer);
  }, []);

  const onRefresh = useCallback(() => {
    fetchNotifications();
    markAsRead();
  }, [fetchNotifications, markAsRead]);

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primary} />
          <Text style={styles.emptyText}>Updating notifications...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={primary} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="notifications-off-outline" size={60} color={lightGray} />
        <Text style={styles.emptyText}>No notifications yet</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Notifications" showBack onBackPress={() => navigation.goBack()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        contentContainerStyle={notifications.length === 0 ? styles.grow : undefined}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loading && notifications.length > 0}
            onRefresh={onRefresh}
            colors={[primary]}
            tintColor={primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  grow: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: '50%',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: gray,
  },
});
