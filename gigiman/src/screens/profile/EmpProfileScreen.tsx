// src/screens/EmployeeProfileScreen.tsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,//
} from 'react-native';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
//import { ProfileAPI } from '@/api/profile.api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ProfileAPI } from '@/api/profile.api';
import { ProfileContext } from '@/context/ProfileContext';
import { AuthContext } from '@/context/AuthContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { UserRole } from '@/utils/enums/CommonEnum';
import { BookingHistoryContext } from "@/context/BookingHistoryContext";


type MenuItem = {
  key: string;
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

// DEPRECATED: Use ProfileScreen.tsx for unified profile UI
export default function EmployeeProfileScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const { profile, refreshProfile } = useContext(ProfileContext);
  const { userRole, logout } = useContext(AuthContext);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { bookings, loading, refresh } = useContext(BookingHistoryContext);
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

  useEffect(() => {
    if (!profile && !loading) {
      safeRefreshProfile();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await safeRefreshProfile();
    setRefreshing(false);
  };

  const menu: MenuItem[] = [
    { key: 'jobs', icon: 'briefcase-outline', title: 'Team Management', subtitle: 'Current team', onPress: () => userRole === UserRole.MULTI_EMPLOYEE ? navigation.navigate('team') : navigation.navigate('TeamRequest') },
    { key: 'Bookings', icon: 'time-outline', title: "Booking History", subtitle: 'Recent', onPress: () => navigation.navigate("RecentBookingHistory") },
    { key: 'earnings', icon: 'wallet-outline', title: 'Earnings', subtitle: 'Week / Month', onPress: () => navigation.navigate('Earnings') },
    { key: 'tools', icon: 'construct-outline', title: 'Tools Needed', subtitle: 'Manage tools', onPress: () => navigation.navigate('Tools') },
    { key: 'bank', icon: 'card-outline', title: 'Banking', subtitle: 'Payout & account', onPress: () => navigation.navigate('Banking') },
    { key: 'support', icon: 'help-circle-outline', title: 'Support', subtitle: 'Contact us', onPress: () => navigation.navigate('Support') },
    { key: 'settings', icon: 'settings-outline', title: 'Settings', onPress: () => navigation.navigate('Settings') },
    { key: 'logout', icon: 'log-out-outline', title: 'Logout' },
  ];

  const headerProps = {
    scrollY,
    name: profile?.fullname || '',
    ownerName: profile?.ownerName || '',
    idText: `ID: ${profile?.empId || profile?.TeamId || ''}`,
    subtitle: profile?.role || '',
    cancelCount: profile?.cancelCount,
    phoneNo: profile?.phoneNo,
    verified: profile?.verified === "Yes",
    onEdit: () => navigation.navigate("EditProfile"),
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text, fontWeight: '600' }}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={80} color="#d9534f" style={{ marginBottom: 20, opacity: 0.7 }} />
        <Text style={{ color: '#d9534f', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>No profile data found.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <ProfileHeader {...headerProps}
        // rightAction={
        //   <TouchableOpacity onPress={() => Alert.alert('Share', 'Share profile')}>
        //     <Ionicons name="share-social-outline" size={20} color="#fff" />
        //   </TouchableOpacity>
        // }
         />

        <LinearGradientBox>
          {/* Quick stats */}
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.completedJobs ?? 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{profile?.earningsMonth ?? 0}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.rating ?? 4.8}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradientBox>

        <View style={[styles.cardShadow, { marginTop: 16 }]}> 
          <LinearGradientBox>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Jobs')}>
                <Ionicons name="play-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Start Job</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings')}>
                <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Tools')}>
                <Ionicons name="construct-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Tools</Text>
              </TouchableOpacity>
            </View>
          </LinearGradientBox>
        </View>

        <View style={[styles.cardShadow, { marginTop: 16 }]}> 
          <LinearGradientBox>
            <Text style={styles.sectionTitle}>Menu</Text>
            {menu.map((m, idx) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.menuRow, idx === 0 && { borderTopWidth: 0 }]}
                onPress={() => {
                  if (m.key === 'logout') {
                    setConfirmVisible(true);
                  } else {
                    m.onPress && m.onPress();
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={m.icon as any} size={22} color={theme.colors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.menuTitle}>{m.title}</Text>
                    {m.subtitle ? <Text style={styles.menuSubtitle}>{m.subtitle}</Text> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#888" />
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
            try {
              await logout();
            } catch (err) {
              Alert.alert('Logout failed', 'Please try again.');
            }
          }}
        />

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 24,
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
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: theme.colors.primary, marginBottom: 2 },
  statLabel: { fontSize: 13, color: '#777', marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, color: theme.colors.text, letterSpacing: 0.2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#faf7ff',
    marginHorizontal: 6,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#d1c4e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { marginTop: 8, color: theme.colors.text, fontWeight: '700', fontSize: 14, letterSpacing: 0.1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingHorizontal: 2 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, letterSpacing: 0.1 },
  menuSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 18,
    alignSelf: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
});

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
