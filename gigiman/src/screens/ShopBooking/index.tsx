// screens/ToolShop/ToolShopBooking.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { theme } from '../../theme/theme';
import OtpInput from '../../components/OtpInput';
import { RouteProp, useRoute } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RouteProps = RouteProp<any, any>;

interface RequestItem {
  id: string;
  employeeName: string;
  employeeId: string;
  items: { name: string; qty: number }[];
  total: number;
  otp?: string;
  status: 'accepted' | 'completed' | 'pending' | 'rejected';
}

export const ToolShopBooking = () => {
  const route = useRoute<RouteProps>();
  const { initialTab, requestId, request } = route.params || {};
  const [activeTab, setActiveTab] = useState<'accepted' | 'completed'>(initialTab === 'completed' ? 'completed' : 'accepted');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [showOtpFor, setShowOtpFor] = useState<string | null>(null);

  useEffect(() => {
    // load requests (from navigation param, storage or backend)
    const init = async () => {
      try {
        if (request) {
          // if passed single request, use it and fetch remainder from storage/backend
          setRequests(prev => {
            const existing = prev.filter(r => r.id !== request.id);
            return [request, ...existing];
          });
        }

        // TODO: fetch from backend or storage. For now use sample:
                const sample: RequestItem[] = [
                  {
                    id: 'REQ001',
                    employeeName: 'Arun Kumar',
                    employeeId: 'EMP-1001',
                    items: [
                      { name: 'Fan Motor', qty: 1 },
                      { name: 'Wire Roll', qty: 2 },
                    ],
                    total: 900,
                    otp: '1234',
                    status: 'accepted',
                  },
                ];
                setRequests(sample);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // if navigation passed a requestId, ensure tab is accepted
    if (requestId) setActiveTab('accepted');
  }, [requestId]);

  const acceptedList = useMemo(() => requests.filter(r => r.status === 'accepted'), [requests]);
  const completedList = useMemo(() => requests.filter(r => r.status === 'completed'), [requests]);

  const handleOtpComplete = (enteredOtp: string, item: RequestItem) => {
    if (enteredOtp === item.otp) {
      LayoutAnimation.easeInEaseOut();
      setRequests(prev => prev.map(r => (r.id === item.id ? { ...r, status: 'completed' } : r)));
      setShowOtpFor(null);
      // TODO: call backend to mark completed: fetch(...).catch(...)
    } else {
      alert('Invalid OTP. Try again.');
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, justifyContent: 'center' }} />;

  const renderCard = (item: RequestItem) => (
    <View key={item.id} style={bookingStyles.card}>
      <Text style={bookingStyles.title}>{item.employeeName} • {item.employeeId}</Text>
      <Text style={bookingStyles.sub}>Parts: {item.items.map(i => `${i.name}×${i.qty}`).join(', ')}</Text>
      <Text style={bookingStyles.sub}>Total: ₹{item.total}</Text>

      {activeTab === 'accepted' && (
        <>
          <TouchableOpacity
            style={bookingStyles.verifyBtn}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              setShowOtpFor(prev => (prev === item.id ? null : item.id));
            }}
          >
            <Text style={bookingStyles.btnText}>{showOtpFor === item.id ? 'Hide OTP' : 'Enter OTP'}</Text>
          </TouchableOpacity>

          {showOtpFor === item.id && (
            <View style={bookingStyles.otpSection}>
              <Text style={bookingStyles.otpTitle}>Enter OTP provided by service provider</Text>
              <OtpInput otpLength={4} onOtpComplete={(code) => handleOtpComplete(code, item)} resendEnabled={false} />
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Bookings" />
      <View style={bookingStyles.tabs}>
        <TouchableOpacity style={[bookingStyles.tab, activeTab === 'accepted' && bookingStyles.activeTab]} onPress={() => setActiveTab('accepted')}>
          <Text style={[bookingStyles.tabText, activeTab === 'accepted' && bookingStyles.activeTabText]}>Accepted</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[bookingStyles.tab, activeTab === 'completed' && bookingStyles.activeTab]} onPress={() => setActiveTab('completed')}>
          <Text style={[bookingStyles.tabText, activeTab === 'completed' && bookingStyles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {(activeTab === 'accepted' ? acceptedList : completedList).length === 0 && <Text style={bookingStyles.empty}>No items</Text>}
        {(activeTab === 'accepted' ? acceptedList : completedList).map(renderCard)}
      </ScrollView>
    </View>
  );
};

const bookingStyles = StyleSheet.create({
  tabs: { flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f1f1f1', marginHorizontal: 6, borderRadius: 10 },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { fontWeight: '600', fontSize: 15 },
  activeTabText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 3 },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  sub: { color: '#555', marginBottom: 4 },
  verifyBtn: { backgroundColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  otpSection: { marginTop: 12, backgroundColor: '#fafafa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  otpTitle: { fontWeight: '600', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#777', marginTop: 40 },
});
