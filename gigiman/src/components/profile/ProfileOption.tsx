import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ProfileOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

export const ProfileOption: React.FC<ProfileOptionProps> = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.row}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  option: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.mediumLine,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:12
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
});
