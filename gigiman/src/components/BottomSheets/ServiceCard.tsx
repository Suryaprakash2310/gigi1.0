import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

interface ServiceCardProps {
  title: string;
  icon: any;
  onPress?: () => void;
}

export const ServiceCard = ({ title, icon, onPress }: ServiceCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '43%',
    backgroundColor: '#e9f0f9',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { width: 50, height: 50 },
  title: {
    ...theme.typography.body,
    // fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 6,
  },
});
