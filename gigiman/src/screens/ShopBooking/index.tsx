import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { theme } from '../../theme/theme';
import { RequestCard } from '../../components/toolshop/RequestCard';

export const ToolShopBooking = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setRequests([
        {
          id: 'REQ001',
          employeeName: 'Arun',
          employeeId: 'EMP-1001',
          items: [
            { name: 'Fan Motor', qty: 1 },
            { name: 'Wire Roll', qty: 2 },
          ],
          total: 900,
          otp: '1234',
          status: 'accepted',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const acceptedList = requests.filter(r => r.status === 'accepted');
  const completedList = requests.filter(r => r.status === 'completed');

  const [tab, setTab] = useState<'accepted' | 'completed'>('accepted');

  const handleCompletion = (id: string) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'completed' } : r))
    );
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;

  const list = tab === 'accepted' ? acceptedList : completedList;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Bookings" />

      <View style={styles.tabs}>
        <Text
          style={[styles.tab, tab === 'accepted' && styles.activeTab]}
          onPress={() => setTab('accepted')}
        >
          Accepted
        </Text>
        <Text
          style={[styles.tab, tab === 'completed' && styles.activeTab]}
          onPress={() => setTab('completed')}
        >
          Completed
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {list.length === 0 ? (
          <Text style={styles.empty}>No records</Text>
        ) : (
          list.map(item => (
            <RequestCard
              key={item.id}
              request={item}
              mode={tab}
              onOtpSubmit={(enteredOtp) => {
                if (enteredOtp === item.otp) {
                  handleCompletion(item.id);
                } else {
                  alert('Invalid OTP');
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12 },
  tab: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: theme.colors.primary, color: '#fff' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
