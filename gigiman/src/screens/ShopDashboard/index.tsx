import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ToolShopStackParamList } from '../../navigation/ToolShopStack';
import { WorkingModeToggle } from '../EmpDashboard/WorkingModeToggle';

type NavProp = NativeStackNavigationProp<ToolShopStackParamList, 'Booking'>;

interface RequestItem {
  id: string;
  employeeName: string;
  employeeId: string;
  items: { name: string; qty: number }[];
  total: number;
  otp?: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
}

const STORAGE_KEY = 'toolshop_requests_v1';

export const ToolShopDashboard = () => {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [workingMode, setWorkingMode] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const hasLoaded = useRef(false); // ✅ prevents premature save

  const MOCK: RequestItem[] = [
    {
      id: 'REQ001',
      employeeName: 'Arun',
      employeeId: 'EMP-1001',
      items: [
        { name: 'Fan Motor', qty: 1 },
        { name: 'Wire', qty: 2 },
      ],
      total: 900,
      otp: '1234',
      status: 'pending',
    },
    {
      id: 'REQ002',
      employeeName: 'Ravi',
      employeeId: 'EMP-1002',
      items: [{ name: 'Switch Box', qty: 3 }],
      total: 450,
      otp: '5472',
      status: 'pending',
    },
  ];

  // ✅ Load data safely
  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as RequestItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('✅ Loaded from AsyncStorage');
            setRequests(parsed);
          } else {
            console.log('⚙️ Empty data found, using mock');
            setRequests(MOCK);
          }
        } else {
          console.log('⚙️ No saved data, using mock');
          setRequests(MOCK);
        }
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setRequests(MOCK);
      } finally {
        hasLoaded.current = true; // now it's safe to save
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ✅ Save only AFTER loading is complete
  useEffect(() => {
    if (hasLoaded.current) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
        .then(() => console.log('💾 Requests saved:', requests.length))
        .catch(err => console.log('❌ Save error', err));
    }
  }, [requests]);

const handleAccept = async (id: string) => {
  if (!workingMode) {
    Alert.alert('Working mode off', 'Turn on working mode to accept requests.');
    return;
  }

  const updated: RequestItem[] = requests.map(req =>
    req.id === id ? { ...req, status: 'accepted' as RequestItem['status'] } : req
  );
  setRequests(updated);

  // 🔹 Save before navigating
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  console.log('💾 Updated accepted request saved');

  // 🔹 Navigate to Booking page
  navigation.navigate('Booking', { initialTab: 'accepted' });
};


  const handleReject = (id: string) => {
    Alert.alert('Reject Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => setRequests(prev => prev.filter(req => req.id !== id)),
      },
    ]);
  };

  const pendingList = requests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Tool Shop Dashboard" />
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <WorkingModeToggle initialValue={workingMode} onToggle={setWorkingMode} />
      </View>

      {pendingList.length === 0 ? (
        <Text style={styles.empty}>⚠️ No pending requests found</Text>
      ) : (
        <FlatList
          data={pendingList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.employeeName}>{item.employeeName}</Text>
                <Text style={styles.employeeId}>#{item.employeeId}</Text>
              </View>

              <View style={styles.itemListContainer}>
                {item.items.map((product, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemQty}>×{product.qty}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{item.total}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptBtn]}
                  onPress={() => handleAccept(item.id)}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.rejectBtn]}
                  onPress={() => handleReject(item.id)}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginVertical: 10,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.8,
    borderColor: '#E0E0E0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  employeeName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  employeeId: { fontSize: 13, color: '#666', fontWeight: '600' },
  itemListContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 10,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  itemQty: { width: 50, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#222' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingTop: 8,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4CAF50', marginRight: 8 },
  rejectBtn: { backgroundColor: '#E53935', marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 40, color: '#777' },
});
