// src/screens/ToolShopProfileScreen.tsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ProfileContext } from '@/context/ProfileContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { AuthContext } from '@/context/AuthContext';

const { width } = Dimensions.get('window');


// DEPRECATED: Use ProfileScreen.tsx for unified profile UI
// export default function ToolShopProfileScreen({ navigation }: any) {
  const { profile, loading, refreshProfile } = useContext(ProfileContext);
  const { logout } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Enhanced error handling for network issues
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

  if (loading && !profile) {
   return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Your actual Shop Profile UI goes here */}
      {profile ? (
        <Text>Welcome to {profile.name}'s Shop!</Text>
      ) : (
        <Text>No profile data available.</Text>
      )}
    </View>
  );
};
  

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>No profile data found.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menu = [
    { key: 'pending', icon: 'time-outline', title: 'Pending Requests', subtitle: 'New orders', onPress: () => navigation.navigate('PendingRequests') },
    { key: 'orders', icon: 'list-outline', title: 'Completed Orders', subtitle: 'History', onPress: () => navigation.navigate('RecentBookingHistory') },
    { key: 'inventory', icon: 'layers-outline', title: 'Inventory & Tools', onPress: () => navigation.navigate('Inventory') },
    { key: 'earnings', icon: 'wallet-outline', title: 'Earnings', onPress: () => navigation.navigate('ShopEarnings') },
    { key: 'settings', icon: 'settings-outline', title: 'Shop Settings', onPress: () => navigation.navigate('ShopSettings') },
    { key: 'logout', icon: 'log-out-outline', title: 'Logout' },
  ];

  const headerProps = {
    scrollY,
    name: profile.shopName,
    idText: `Shop ID: ${profile.toolShopId}`,
    subtitle: profile.role,
    verified: profile.verified === "Yes",
    onEdit: () => navigation.navigate("EditProfile"),
    // Add a beautiful cover image if available
    coverImage: profile.coverImage || undefined,
    avatar: profile.avatar || undefined,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <ProfileHeader {...headerProps}
          // rightAction={
          //   <TouchableOpacity onPress={() => Alert.alert('Share', 'Share shop')}>
          //     <Ionicons name="share-social-outline" size={20} color="#fff" />
          //   </TouchableOpacity>
          // }
        />

        {/* Shop Summary Card */}
        <View style={styles.cardShadow}>
          <LinearGradientBox>
            <Text style={styles.sectionTitle}>Shop Summary</Text>
            <View style={styles.shopMetaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{profile?.pendingRequests ?? 0}</Text>
                <Text style={styles.metaLabel}>Pending</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>₹{profile?.monthlyRevenue ?? 0}</Text>
                <Text style={styles.metaLabel}>This Month</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{profile?.responseTime ?? '—'}</Text>
                <Text style={styles.metaLabel}>Response</Text>
              </View>
            </View>
          </LinearGradientBox>
        </View>

        {/* Quick Actions Card */}
        <View style={[styles.cardShadow, { marginTop: 16 }]}>
          <LinearGradientBox>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PendingRequests')}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Requests</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Inventory')}>
                <Ionicons name="cube-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ShopEarnings')}>
                <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Payout</Text>
              </TouchableOpacity>
            </View>
          </LinearGradientBox>
        </View>

        {/* Menu Card */}
        <View style={[styles.cardShadow, { marginTop: 16 }]}>
          <LinearGradientBox>
            <Text style={styles.sectionTitle}>Menu</Text>
            {menu.map((m, idx) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.menuRow, idx === 0 && { borderTopWidth: 0 }]}
                onPress={() => {
                  if (m.key === 'logout') {
                    setSelectedAction('logout');
                    setConfirmVisible(true);
                  } else if (m.onPress) {
                    m.onPress();
                  } else {
                    Alert.alert(m.title);
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
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f4f4ff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f4f4ff',
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  shopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 2,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  metaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff8f2',
    marginHorizontal: 6,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f5cba7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingHorizontal: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

