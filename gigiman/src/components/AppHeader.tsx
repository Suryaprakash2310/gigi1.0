import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

interface AppHeaderProps {
  title?: string;    //this is for the app header section name 
  subtitle?: string;   // this is for the below section of app header
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onBackPress?: () => void;
  onRightPress?: () => void;
  backgroundColor?: string;
  textAlign?: 'center' | 'left';
  elevation?: number;
}

/**
 * 🎯 Modern Onboarding Header
 * - No image or progress bar
 * - Large title with subtitle below
 * - Back + optional right icon
 */
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
      {/* Top Row: Back + Right Icon */}
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Ionicons
              name={ 'chevron-back' }
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        {title ? <Text style={styles.title}>{title}</Text> : null}

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={24} color={theme.colors.text} />
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
   ...theme.typography.h1,
    textAlign: 'left',
  },
});
