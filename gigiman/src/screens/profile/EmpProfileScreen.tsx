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

type MenuItem = {
  key: string;
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export default function EmployeeProfileScreen({ navigation }: any) {
  //const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { profile, refreshProfile } = useContext(ProfileContext);
  const { userRole, logout } = useContext(AuthContext);
  const [confirmVisible, setConfirmVisible] = useState(false);

  

  const scrollY = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   loadProfile();
  // }, []);

  // const loadProfile = async () => {
  //   try {
  //     setLoading(true);
  //     const token = await AsyncStorage.getItem('userToken');
  //     const res = await ProfileAPI.getProfile(token) ; // expects your backend to return employee object
  //     setProfile(res);
  //   } catch (err: any) {
  //     console.error('Profile load error', err);
  //     Alert.alert('Error', err?.message || 'Failed to load profile');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onRefresh = async () => {
    setRefreshing(true);
    //await loadProfile();
    setRefreshing(false);
  };

  const menu: MenuItem[] = [
    { key: 'jobs', icon: 'briefcase-outline', title: 'Team Management', subtitle: 'Current team', onPress: () => userRole === UserRole.MULTI_EMPLOYEE ? navigation.navigate('team') : navigation.navigate('TeamRequest') },
    { key: 'today', icon: 'time-outline', title: "Job", subtitle: 'Active job' },
    { key: 'earnings', icon: 'wallet-outline', title: 'Earnings', subtitle: 'Week / Month' },
    { key: 'tools', icon: 'construct-outline', title: 'Tools Needed', subtitle: 'Manage tools' },
    { key: 'bank', icon: 'card-outline', title: 'Banking', subtitle: 'Payout & account' },
    { key: 'support', icon: 'help-circle-outline', title: 'Support', subtitle: 'Contact us' },
    { key: 'settings', icon: 'settings-outline', title: 'Settings' },
    { key: 'logout', icon: 'log-out-outline', title: 'Logout' },
  ];

  // if (loading) {
  //   return (
  //     <View style={styles.center}>
  //       <ActivityIndicator size="large" color={theme.colors.primary} />
  //     </View>
  //   );
  // }

  const headerProps = {
    scrollY,
    name: profile.fullname,
    idText: `ID: ${profile.empId}`,
    subtitle: profile.role,
    verified: profile.verified === "Yes",
    onEdit: () => navigation.navigate("EditProfile"),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <ProfileHeader {...headerProps} 
        // rightAction={
        //   <TouchableOpacity onPress={() => Alert.alert('Share', 'Share profile')}>
        //     <Ionicons name="share-social-outline" size={20} color="#fff" />
        //   </TouchableOpacity>
        // }
         />

        <View style={styles.card}>
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
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
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
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Menu</Text>

          {menu.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={styles.menuRow}
              onPress={() => {
                if (m.key === 'logout') {
                  setConfirmVisible(true);
                } else {
                  m.onPress && m.onPress();
                }
              }}
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
              console.error('Logout failed', err);
            }
          }}
        />

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    marginTop: 8,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  statLabel: { fontSize: 12, color: '#666', marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.colors.text },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: {
    flex: 1,
    backgroundColor: '#faf7ff',
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { marginTop: 6, color: theme.colors.text, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  menuSubtitle: { fontSize: 12, color: '#888' },
});
