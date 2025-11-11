import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileOption } from '../components/profile/ProfileOption';
import { theme } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => {logout} },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40, padding:16 }}>
        {/*  Common Profile Header */}
        <ProfileHeader
          name="Saravanan"
          id="EMP1003"
          role="Multi Employee"
          verified={true}
          onEdit={() => console.log('Edit profile')}
        />

        {/* ⚙️ Profile Options */}
        <View style={styles.section}>
          <ProfileOption icon="briefcase-outline" title="Job History" onPress={() => {}} />
          <ProfileOption icon="wallet-outline" title="Earnings" onPress={() => {}} />
          <ProfileOption icon="construct-outline" title="Tools Needed" onPress={() => {}} />
          <ProfileOption icon="card-outline" title="Banking" onPress={() => {}} />
          <ProfileOption icon="help-circle-outline" title="Customer Support" onPress={() => {}} />
          <ProfileOption icon="log-out-outline" title="Logout" onPress={logout} />
        </View>

        {/* 📱 Footer */}
        <View style={styles.footer}>
          <Text style={styles.version}>Gigiman v1.0.0</Text>
          <Text style={styles.tagline}>Empowering Gray collor Services </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f4f4ff',
  },
  section: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'flex-start',
    marginTop: 30,
  },
  version: {
    fontSize: 13,
    color: '#999',
  },
  tagline: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    marginTop: 4,
  },
});
