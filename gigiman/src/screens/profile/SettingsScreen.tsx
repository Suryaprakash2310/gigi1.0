import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthContext } from '@/context/AuthContext';
import { UserRole } from '@/utils/enums/CommonEnum';
import { theme } from '../../theme/theme';
import AppHeader from '@/components/AppHeader';

const settingsOptions = [
  { key: 'profile', icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' }, 
  { key: 'notifications', icon: 'notifications-outline', label: 'Notifications', screen: 'NotificationSettings' },
  { key: 'language', icon: 'language-outline', label: 'Language', screen: 'LanguageSettings' },
  { key: 'about', icon: 'information-circle-outline', label: 'About', screen: 'About' },
  { key: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacy Policy', screen: 'PrivacyPolicy' },
  { key: 'terms', icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'TermsAndConditions' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { userRole, logout } = React.useContext(AuthContext);

  // Add role-specific options if needed
  let roleOptions: Array<{ key: string; icon: string; label: string; screen: string }> = [];
  if (userRole === UserRole.TOOL_SHOP) {
    roleOptions.push({ key: 'shopSettings', icon: 'settings-outline', label: 'Shop Settings', screen: 'ShopSettings' });
  }
  if (userRole === UserRole.SINGLE_EMPLOYEE || userRole === UserRole.MULTI_EMPLOYEE) {
    roleOptions.push({ key: 'bank', icon: 'card-outline', label: 'Bank Details', screen: 'Banking' });
  }

  const allOptions = [...settingsOptions, ...roleOptions];

  return (
    <SafeAreaView style={styles.safeArea}>
        <AppHeader showBack title="Settings" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        
        {allOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.optionRow}
            onPress={() => navigation.navigate(option.screen)}
            activeOpacity={0.7}
          >
            <Ionicons name={option.icon as any} size={22} color={theme.colors.primary} style={{ marginRight: 16 }} />
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ))}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: theme.colors.text,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 40,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
