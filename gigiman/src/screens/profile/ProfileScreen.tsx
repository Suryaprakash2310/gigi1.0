import React, { useContext, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
  FlatList,
  ImageSourcePropType,
} from "react-native";
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ProfileContext } from "@/context/ProfileContext";
import { AuthContext } from "@/context/AuthContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import AppHeader from "@/components/AppHeader";

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }: any) => {
  const { profile, loading, refreshProfile } = useContext(ProfileContext);
  const { userRole, logout } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Simple LinearGradient wrapper for cards (replace with expo-linear-gradient if available)
  const LinearGradientBox = ({ children }: { children: React.ReactNode }) => (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    }}>
      {children}
    </View>
  );

  // Robust error handling for network issues
  const safeRefreshProfile = async () => {
    setError(null);
    try {
      await refreshProfile();
    } catch (err: any) {
      setError('Unable to load profile. Please check your internet connection and try again.');
    }
  };

  React.useEffect(() => {
    if (!profile && !loading) {
      safeRefreshProfile();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await safeRefreshProfile();
    setRefreshing(false);
  };

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderOfflineBanner = () => {
    if (error || !profile) {
      return (
        <View style={{ backgroundColor: '#ffebee', padding: 12, alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginTop: 16 }}>
          <Text style={{ color: '#d32f2f', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
            {error || 'Offline mode. Profile data unavailable.'}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: 8, backgroundColor: '#d32f2f', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };


  // TOOL_SHOP PROFILE UI
  if (userRole === UserRole.TOOL_SHOP) {
    const menu = [
      { key: 'details', icon: 'person-outline', title: 'Profile details', subtitle: 'View your info', onPress: () => navigation.navigate('ProfileDetails') },
      { key: 'tools', icon: 'construct-outline', title: 'Tools & Domains', subtitle: 'Manage listings', onPress: () => navigation.navigate('Tools') },
      { key: 'pending', icon: 'time-outline', title: 'Pending Requests', subtitle: 'New orders', onPress: () => navigation.navigate('PendingRequests') },
      { key: 'orders', icon: 'list-outline', title: 'Completed Orders', subtitle: 'History', onPress: () => navigation.navigate('RecentBookingHistory') },
      // { key: 'inventory', icon: 'layers-outline', title: 'Inventory', onPress: () => navigation.navigate('Inventory') },
      // { key: 'earnings', icon: 'wallet-outline', title: 'Earnings', onPress: () => navigation.navigate('ShopEarnings') },
      { key: 'about', icon: 'information-circle-outline', title: 'About Gigiman', onPress: () => navigation.navigate('AboutGigiman') },
      { key: 'terms', icon: 'document-text-outline', title: 'Terms & Conditions', onPress: () => navigation.navigate('TermsAndConditions') },
      { key: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy') },
      { key: 'support', icon: 'help-circle-outline', title: 'Support', onPress: () => navigation.navigate('Support') },
      { key: 'settings', icon: 'settings-outline', title: 'Settings', onPress: () => navigation.navigate('SettingsScreen') },
      { key: 'logout', icon: 'log-out-outline', title: 'Logout' },
    ];
    const headerProps = {
      name: profile?.shopName || profile?.ownerName || '',
      subtitle: 'Tool Shop',
      avatar: profile?.avatar || undefined,
    };
    return (
      <View style={styles.safeArea}>
        <AppHeader title="Profile" />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Simple Header */}
          <View style={styles.simpleHeader}>
            <Image 
              source={(headerProps.avatar ? { uri: headerProps.avatar } : require('../../../assets/icon.png')) as ImageSourcePropType} 
              style={styles.simpleAvatar} 
            />
            <View style={styles.headerTextCol}>
              <Text style={styles.simpleName}>{headerProps.name}</Text>
              <Text style={styles.simpleRole}>{headerProps.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("EditProfile")} style={{ padding: 4 }}>
              <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            {profile?.verified === "Yes" && <Ionicons name="checkmark-done-circle" size={24} color={theme.colors.success} style={{ marginLeft: 8 }} />}
          </View>

          {renderOfflineBanner()}

          {/* Menu Card */}
          <View style={[styles.cardShadow, { marginTop: 10 }]}>
            <LinearGradientBox>
              {menu.map((m, idx) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.menuRow, idx === 0 && { borderTopWidth: 0 }]}
                  onPress={() => {
                    if (m.key === 'logout') {
                      setConfirmVisible(true);
                    } else if (m.onPress) {
                      m.onPress();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={m.icon as any} size={20} color={theme.colors.primary} />
                    </View>
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.menuTitle}>{m.title}</Text>
                      {m.subtitle ? <Text style={styles.menuSubtitle}>{m.subtitle}</Text> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BBB" />
                </TouchableOpacity>
              ))}
            </LinearGradientBox>
          </View>
          <ConfirmDialog
            visible={confirmVisible}
            title="Logout"
            message="Are you sure you want to logout?"
            confirmText="Logout"
            cancelText="Cancel"
            onCancel={() => setConfirmVisible(false)}
            onConfirm={async () => {
              setConfirmVisible(false);
              try { await logout(); } catch (err) { Alert.alert('Error', 'Logout failed'); }
            }}
          />
        </Animated.ScrollView>
      </View>
    );
  }

  // EMPLOYEE PROFILE UI
  if (userRole === UserRole.SINGLE_EMPLOYEE || userRole === UserRole.MULTI_EMPLOYEE) {
    const menu = [
      { key: 'details', icon: 'person-outline', title: 'Profile details', subtitle: 'Full info', onPress: () => navigation.navigate('ProfileDetails') },
      { key: 'services', icon: 'construct-outline', title: 'Service Categories', subtitle: 'Manage skills', onPress: () => navigation.navigate('ServiceCategory') },
      { key: 'team', icon: 'people-outline', title: 'Team Management', onPress: () => userRole === UserRole.MULTI_EMPLOYEE ? navigation.navigate('team') : navigation.navigate('TeamRequest') },
      { key: 'bookings', icon: 'calendar-outline', title: "Booking History", onPress: () => navigation.navigate("RecentBookingHistory") },
      // { key: 'earnings', icon: 'wallet-outline', title: 'Earnings', onPress: () => navigation.navigate('Earnings') },
      // { key: 'bank', icon: 'card-outline', title: 'Banking', onPress: () => navigation.navigate('Banking') },
      { key: 'about', icon: 'information-circle-outline', title: 'About Gigiman', onPress: () => navigation.navigate('AboutGigiman') },
      { key: 'terms', icon: 'document-text-outline', title: 'Terms & Conditions', onPress: () => navigation.navigate('TermsAndConditions') },
      { key: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy') },
      { key: 'support', icon: 'help-circle-outline', title: 'Support', onPress: () => navigation.navigate('Support') },
      { key: 'settings', icon: 'settings-outline', title: 'Settings', onPress: () => navigation.navigate('SettingsScreen') },
      { key: 'logout', icon: 'log-out-outline', title: 'Logout' },
    ];
    const headerProps = {
      name: profile?.fullname || profile?.ownerName || '',
      subtitle: userRole === UserRole.MULTI_EMPLOYEE ? 'Service Team' : 'Service Provider',
      avatar: profile?.avatar,
    };
    return (
      <View style={styles.safeArea}>
        <AppHeader title="Profile"  />
        <Animated.ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Simple Header */}
          <View style={styles.simpleHeader}>
            <Image
              source={(headerProps.avatar ? { uri: headerProps.avatar } : require('../../../assets/icon.png')) as ImageSourcePropType}
              style={styles.simpleAvatar}
            />
            <View style={styles.headerTextCol}>
              <Text style={styles.simpleName}>{headerProps.name}</Text>
              <Text style={styles.simpleRole}>{headerProps.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("EditProfile")} style={{ padding: 4 }}>
              <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            {profile?.verified === "Yes" && <Ionicons name="checkmark-done-circle" size={24} color={theme.colors.success} style={{ marginLeft: 8 }} />}
          </View>

          {renderOfflineBanner()}

          <View style={[styles.cardShadow, { marginTop: 10 }]}>
            <LinearGradientBox>
              {menu.map((m, idx) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.menuRow, idx === 0 && { borderTopWidth: 0 }]}
                  onPress={() => {
                    if (m.key === 'logout') {
                      setConfirmVisible(true);
                    } else if (m.onPress) {
                      m.onPress();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={m.icon as any} size={20} color={theme.colors.primary} />
                    </View>
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.menuTitle}>{m.title}</Text>
                      {m.subtitle ? <Text style={styles.menuSubtitle}>{m.subtitle}</Text> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BBB" />
                </TouchableOpacity>
              ))}
            </LinearGradientBox>
          </View>
          <ConfirmDialog
            visible={confirmVisible}
            title="Logout"
            message="Are you sure you want to logout?"
            confirmText="Logout"
            cancelText="Cancel"
            onCancel={() => setConfirmVisible(false)}
            onConfirm={async () => {
              setConfirmVisible(false);
              try { await logout(); } catch (err) { Alert.alert('Error', 'Logout failed'); }
            }}
          />
        </Animated.ScrollView>
      </View>
    );
  }

  return null;
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  cardShadow: {
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingHorizontal: 2
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.1
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  simpleAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  headerTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  simpleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  simpleRole: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
