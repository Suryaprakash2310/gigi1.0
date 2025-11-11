import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { WorkingModeToggle } from './WorkingModeToggle';
import { ClientRequestCard } from './ClientRequestCard';
import { theme } from '../../theme/theme';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/EmployeeStack';
type TabNavProp = BottomTabNavigationProp<AppStackParamList, 'Booking'>;

const { width } = Dimensions.get('window');

export const EmpDashboard = () => {
  const [workingMode, setWorkingMode] = useState(true);
  const [clientRequests, setClientRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<TabNavProp>();

  // 🧠 Fetch data (mock API)
  const fetchClientRequests = useCallback(async () => {
    setLoading(true);

    // Try loading saved local data first
    const storedData = await AsyncStorage.getItem('clientRequests');
    if (storedData) {
      setClientRequests(JSON.parse(storedData));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // If no stored data, load from mock server
    setTimeout(async () => {
      const mockData = [
        {
          id: 1,
          name: 'Suga',
          work: 'Fan Repair',
          cost: '₹450',
          address: 'Trichy',
        },
        {
          id: 2,
          name: 'Anbu',
          work: 'Switch Setup',
          cost: '₹800',
          address: 'Madurai',
        },
        {
          id: 3,
          name: 'Ravi',
          work: 'Wiring',
          cost: '₹1200',
          address: 'Salem',
        },
      ];
      setClientRequests(mockData);
      await AsyncStorage.setItem('clientRequests', JSON.stringify(mockData));
      setLoading(false);
      setRefreshing(false);
    }, 1200);
  }, []);

  // 🔁 Auto-refresh like real-time data
  useEffect(() => {
    fetchClientRequests();
    const interval = setInterval(fetchClientRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchClientRequests]);

  // 🧭 Manual Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClientRequests();
  };

  // ✅ Accept / Reject with AsyncStorage persistence
 const handleAccept = async (job: any) => {
  Alert.alert('Job Accepted', `Redirecting to booking page...`);

  const updated = clientRequests.filter(req => req.id !== job.id);
  setClientRequests(updated);
  await AsyncStorage.setItem('clientRequests', JSON.stringify(updated));

  // Navigate with both jobId and job details
  navigation.navigate('Booking', {
    fromDashboard: true,
    jobId: job.id,
    jobDetails: job,
  });
};


  const handleReject = async (id: number) => {
    Alert.alert('Job Rejected', `You rejected request ID: ${id}`);

    const updated = clientRequests.filter(req => req.id !== id);
    setClientRequests(updated);
    await AsyncStorage.setItem('clientRequests', JSON.stringify(updated));

    const rejected = JSON.parse(await AsyncStorage.getItem('rejectedJobs') || '[]');
    rejected.push(id);
    await AsyncStorage.setItem('rejectedJobs', JSON.stringify(rejected));
  };

  // ✅ Reset Dashboard (optional helper)
  const resetDashboard = async () => {
    await AsyncStorage.multiRemove(['clientRequests', 'acceptedJobs', 'rejectedJobs']);
    fetchClientRequests();
  };

  // ✅ Header UI
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <WorkingModeToggle initialValue={workingMode} onToggle={setWorkingMode} />

      <View style={styles.summaryContainer}>
        <Text style={styles.greeting}>
          {new Date().getHours() < 12
            ? 'Good Morning'
            : new Date().getHours() < 18
            ? 'Good Afternoon'
            : 'Good Evening'}
        </Text>
        <Text style={styles.subGreeting}>Surya ..</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {clientRequests.length}
            </Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {workingMode ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.statLabel}>Mode</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // // 💤 Offline mode
  // if (!workingMode) {
  //   return (
  //     <View style={styles.offlineContainer}>
  //       <AppHeader title="Gigiman" showBack={false} />
  //       <View style={styles.offlineContent}>
  //         <Text style={styles.offlineText}>You are Offline</Text>
  //         <Text style={styles.offlineSubText}>
  //           Switch to Working Mode to receive jobs
  //         </Text>
  //       </View>
  //     </View>
  //   );
  // }

  // ⏳ Loading screen
  // if (loading) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <ActivityIndicator size="large" color={theme.colors.primary} />
  //       <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Gigiman"
        showBack={false}
        rightIcon="refresh-outline"
        onRightPress={resetDashboard}
      />
      {renderHeader()}

      {!workingMode ? (
      <View style={styles.offlineContainer}>
        <View style={styles.offlineContent}>
          <Text style={styles.offlineText}>You are Offline</Text>
          <Text style={styles.offlineSubText}>
            Switch to Working Mode to receive jobs
          </Text>
        </View>
      </View>) :(
      
       loading ?
     (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
      </View>
    ):(
  

      <FlatList
        data={clientRequests}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => (
          <ClientRequestCard
            data={item}
            role="employee"
            index={index}
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleReject(item.id)}
          />
        )}
        
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollArea}
      />))}
    </View>
  );
};

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  headerContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: 10,
    paddingBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  greeting: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: width * 0.04,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: width * 0.38,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: width * 0.035,
    color: '#777',
    marginTop: 3,
  },
  scrollArea: { paddingBottom: 80 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineContainer: { flex: 1, backgroundColor: '#fff' },
  offlineContent: { alignItems: 'center', marginTop: 100 },
  offlineText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#444',
  },
  offlineSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
