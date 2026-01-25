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
} from 'react-native';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ProfileContext } from '@/context/ProfileContext';


export default function ToolShopProfileScreen({ navigation }: any) {
   const { profile, loading, refreshProfile } = useContext(ProfileContext);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  if (!profile && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) return null;

  const onRefresh = async () => {
  setRefreshing(true);
  await refreshProfile();
  setRefreshing(false);
};


  const menu = [
    { key: 'pending', icon: 'time-outline', title: 'Pending Requests', subtitle: 'New orders' },
    { key: 'orders', icon: 'list-outline', title: 'Completed Orders' },
    { key: 'inventory', icon: 'layers-outline', title: 'Inventory & Tools' },
    { key: 'earnings', icon: 'wallet-outline', title: 'Earnings' },
    { key: 'settings', icon: 'settings-outline', title: 'Shop Settings' },
  ];

  

  const headerProps = {
    scrollY,
    name: profile.shopName,
    idText: `Shop ID: ${profile.toolShopId}`,
    subtitle: profile.role,
    verified: profile.verified === "Yes",
    onEdit: () => navigation.navigate("EditProfile"),
  };

  return (
    <View style={styles.container}>
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
        //   <TouchableOpacity onPress={() => Alert.alert('Share', 'Share shop')}>
        //     <Ionicons name="share-social-outline" size={20} color="#fff" />
        //   </TouchableOpacity>
        // } 
        />

        <View style={styles.card}>
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
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
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
        </View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Menu</Text>

          {menu.map((m) => (
            <TouchableOpacity key={m.key} style={styles.menuRow} onPress={() => Alert.alert(m.title)}>
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

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4f4ff', paddingBottom:50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    //marginTop: 8,
    //paddingHorizontal: 16
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.colors.text },
  shopMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', flex: 1 },
  metaValue: { fontSize: 18, fontWeight: '700' },
  metaLabel: { fontSize: 12, color: '#777', marginTop: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff8f2',
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
