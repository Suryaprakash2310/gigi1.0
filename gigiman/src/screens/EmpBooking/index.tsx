import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserDetailContainer } from './UserDetailContainer';
import { theme } from '../../theme/theme';
import AppHeader from '../../components/AppHeader';
import OtpInput from '../../components/OtpInput';
import BottomButton from '../../components/Bottom';
import { BookingStackParamList } from '../../navigation/EmpBookingStack';
import { AppStackParamList } from '../../navigation/EmployeeStack';

const { width } = Dimensions.get('window');

// ✅ Type-safe route and navigation props
type BookingRouteProp = RouteProp<AppStackParamList, 'Booking'>;
type BookingNavProp = NativeStackNavigationProp<BookingStackParamList, 'PartBuying'>;

export const EmpBookingScreen = () => {
  const navigation = useNavigation<BookingNavProp>();
  const route = useRoute<BookingRouteProp>();

  // ✅ Destructure route params safely
  const params = (route.params ?? {}) ;
  const { fromDashboard, jobId, jobDetails } = params;

  // ✅ State
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [partsFilled, setPartsFilled] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showShopInfo, setShowShopInfo] = useState(false);
  const [job, setJob] = useState<any>(jobDetails || null);
  const [loading, setLoading] = useState(!jobDetails);

  // ✅ Handle case when parts are returned from Parts screen
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as any;
      if (params?.partsbuyed) {
        setOtpVerified(true);
        setShowLoader(true);
        setPartsFilled(true);

        setTimeout(() => {
          setShowLoader(false);
          setShowShopInfo(true);
        }, 1500); // loader visible for 1.5 seconds
      }
    }, [route.params])
  );

  // ✅ Fetch job details only if needed
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobDetails && jobId) {
        try {
          const res = await fetch(`https://your-backend/api/jobs/${jobId}`);
          const data = await res.json();
          setJob(data);
        } catch (err) {
          console.error('Failed to load job details', err);
          Alert.alert('Error', 'Unable to load job details.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  // ✅ Verify OTP
  const handleVerifyOtp = () => {
    if (otp === '1234') {
      setOtpVerified(true);
    } else {
      Alert.alert('Invalid OTP', 'Please try again.');
    }
  };

  // ✅ Navigate to Parts page
  const handlePartsPress = () => {
    navigation.navigate('PartBuying');
  };

  // ✅ When product is collected → reset the parts state
  const handleProductCollected = () => {
    setShowShopInfo(false);
    setPartsFilled(false);
    navigation.setParams({ partsbuyed: false } as any);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading job details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Booking" />
      <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >

    <TouchableWithoutFeedback>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

      {/* ✅ Job Details Section */}
      <UserDetailContainer
        name={job?.name || 'Unknown'}
        work={job?.work || '-'}
        cost={job?.cost || '-'}
        address={job?.address || '-'}
        employeeCount={job?.employeeCount || '1'}
        workingHours={job?.workingHours || 'Not Provided'}
      />

      {/* ✅ OTP Verification Section */}
      {!otpVerified && (
        <View style={styles.otpContainer}>
          <Text style={styles.subTitle}>
            Go to the client location and get the OTP to start work!
          </Text>
          <Text style={styles.label}>Enter OTP:</Text>

          <OtpInput onOtpComplete={(code) => setOtp(code)} />

          <BottomButton onPress={handleVerifyOtp} title="Verify" widthCount={0.5} />
        </View>
      )}

      {/* ✅ After OTP Verified */}
      {otpVerified && (
        <View style={styles.nextPart}>
          <Text style={styles.successText}>Get started, buddy! </Text>

          {/* 1️⃣ Parts Section */}
          {!partsFilled && !showShopInfo && (
            <View style={{ gap: 16 }}>
              <Text style={styles.subTitle}>
                Verify your job and add required parts if needed
              </Text>
              <BottomButton title="Add Parts" onPress={handlePartsPress} widthCount={0.4} />
            </View>
          )}

          {/* 2️⃣ Loader */}
          {showLoader && <ActivityIndicator size="large" color={theme.colors.primary} />}

          {/* 3️⃣ Tool Shop Info */}
          {showShopInfo && (
            <View style={styles.shopContainer}>
              <Text style={styles.shopName}>Shop: Ram Electronics</Text>
              <Text style={styles.shopAddress}>Address: 12, Main Road, Trichy</Text>
              <Text style={styles.shopOtp}>Pickup OTP: 5472</Text>

              <TouchableOpacity style={styles.collectedButton} onPress={handleProductCollected}>
                <Text style={styles.collectedText}>Collected</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ Job Completed Button */}
          {!partsFilled && !showShopInfo && (
            <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
              <BottomButton title="Job Completed" onPress={handlePartsPress} widthCount={0.8} />
            </View>
          )}
        </View>
      )}
      </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fafafa' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subTitle: { ...theme.typography.subheading, fontWeight: 'bold' },
  otpContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 18,
  },
  label: { color: theme.colors.text, ...theme.typography.body },
  nextPart: {
    flex: 1,
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  successText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  shopContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginTop: 10,
  },
  shopName: { fontSize: 16, fontWeight: 'bold' },
  shopAddress: { fontSize: 14, marginVertical: 4 },
  shopOtp: { fontSize: 16, color: theme.colors.primary, fontWeight: 'bold', marginBottom: 10 },
  collectedButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectedText: { color: '#fff', fontSize: 15 },
  partsButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  partsText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
