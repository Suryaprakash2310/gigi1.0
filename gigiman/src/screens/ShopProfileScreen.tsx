import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import { ShopProfileHeader } from '../components/profile/ShopProfileHeader';
import { ProfileOption } from '../components/profile/ProfileOption';
import { theme } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';

export default function ToolShopProfileScreen() {
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => console.log('Logged out') },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Tool Shop Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/*  Common Shop Profile Header */}
        <ShopProfileHeader
          shopName="Ram Electricals"
          shopId="SHOP104"
          domain="ramelectricals.gigiman.in"
          location="Trichy, Tamil Nadu"
          verified={true}
          onEdit={() => console.log('Edit shop profile')}
        />

        {/*  Profile Options */}
        <View style={styles.section}>
          <ProfileOption icon="briefcase-outline" title="Pending Requests" onPress={() => {}} />
          <ProfileOption icon="wallet-outline" title="Earnings" onPress={() => {}} />
          <ProfileOption icon="construct-outline" title="Inventory & Tools" onPress={() => {}} />
          <ProfileOption icon="card-outline" title="Banking" onPress={() => {}} />
          <ProfileOption icon="help-circle-outline" title="Support" onPress={() => {}} />
          <ProfileOption icon="log-out-outline" title="Logout" onPress={logout} />
        </View>

        {/*  Footer */}
        <View style={styles.footer}>
          <Text style={styles.version}>Gigiman Toolshop v1.0.0</Text>
          <Text style={styles.tagline}>Empowering Local Shops ⚙️</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  section: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  version: {
    fontSize: 13,
    color: '#999',
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
