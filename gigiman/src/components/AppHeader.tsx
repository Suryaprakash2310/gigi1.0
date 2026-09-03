import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useNotificationStore } from '../store/notification.store';

const { width } = Dimensions.get('window');

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onBackPress?: () => void;
  onRightPress?: () => void;
  backgroundColor?: string;
  textAlign?: 'center' | 'left';
  elevation?: number;
}

export default function AppHeader({
  title = '',
  subtitle,
  showBack = false,
  rightIcon,
  onBackPress,
  onRightPress,
  backgroundColor = theme.colors.background,
  textAlign = 'left',
  elevation = 0,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationStore(state => state.unreadCount);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor,
          elevation,
          shadowOpacity: elevation ? 0.15 : 0,
        },
      ]}
    >
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        {title ? <Text style={styles.title}>{title}</Text> : null}

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={24} color={theme.colors.text} />
            {rightIcon === 'notifications-outline' && unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Title and Subtitle */}
      <View style={styles.textContainer}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: width * 0.06,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },
  textContainer: {
    marginTop: 24,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.h2,

    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: 'left',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
