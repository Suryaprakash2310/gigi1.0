import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { theme } from '../../theme/theme';
import { RequestCard } from '../../components/toolshop/RequestCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkingModeToggle } from '../EmpDashboard/WorkingModeToggle';
import { useNavigation } from '@react-navigation/native';

const STORAGE_KEY = 'toolshop_requests_v1';

export const ToolShopDashboard = () => {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingMode, setWorkingMode] = useState(true);

  const MOCK = [
    {
      id: 'REQ001',
      employeeName: 'Arun',
      employeeId: 'EMP-1001',
      items: [
        { name: 'Fan Motor', qty: 1 },
        { name: 'Wire', qty: 2 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
        { name: 'Fan Motor', qty: 1 },
      ],
      total: 900,
      otp: '1234',
      status: 'pending',
    },
  ];

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setRequests(raw ? JSON.parse(raw) : MOCK);
      setLoading(false);
    };
    load();
  }, []);

  const handleAccept = async (req) => {
    if (!workingMode) {
      return Alert.alert('Working mode is OFF');
    }

    const updated = requests.map(r =>
      r.id === req.id ? { ...r, status: 'accepted' } : r
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRequests(updated);

    navigation.navigate('Booking', { initialTab: 'accepted' });
  };

  const handleReject = (req) => {
    Alert.alert('Reject', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Reject',
        onPress: () =>
          setRequests(prev => prev.filter(r => r.id !== req.id)),
      },
    ]);
  };

  const pendingList = requests.filter(r => r.status === 'pending');

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Dashboard" />
      <View style={{ padding: 16 }}>
        <WorkingModeToggle initialValue={workingMode} onToggle={setWorkingMode} />
      </View>

      {pendingList.length === 0 ? (
        <Text style={styles.empty}>No pending requests</Text>
      ) : (
        <FlatList
          data={pendingList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              mode="pending"
              onAccept={() => handleAccept(item)}
              onReject={() => handleReject(item)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 30, color: '#999' },
});
