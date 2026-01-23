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
import { socket } from '@/socket/socket';
import apiClient from '@/api/client';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

// ✅ Type-safe route and navigation props
type BookingRouteProp = RouteProp<
  BookingStackParamList,
  "Booking"
>;

type BookingNavProp = BottomTabNavigationProp<
  BookingStackParamList,
  "Booking"
>;

export const EmpBookingScreen = () => {
  const navigation = useNavigation<BookingNavProp>();
  const route = useRoute<BookingRouteProp>();

  const { bookingId } = route.params ?? {};

  console.log("🧭 bookingId:", bookingId);




  // ✅ State
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [partsFilled, setPartsFilled] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [pickupDetails, setPickupDetails] = useState<any | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partRequest, setPartRequest] = useState<any>(null);
  const [waitingApproval, setWaitingApproval] = useState(false);

  //   const PART_REQUEST_STATUS = {
  //   REQUESTED: "REQUESTED",
  //   APPROVED_BY_USER: "APPROVED_BY_USER",
  //   WAITING_TOOLSHOP: "WAITING_TOOLSHOP",
  //   READY_FOR_PICKUP: "READY_FOR_PICKUP",
  //   COLLECTED: "COLLECTED",
  // };
  // type PartRequestStatus = keyof typeof PART_REQUEST_STATUS;


  console.log('Booking Screen Params:', { bookingId });
  // ✅ Handle case when parts are returned from Parts screen


  // useFocusEffect(
  //   React.useCallback(() => {
  //     const params = route.params as any;
  //     if (params?.partsbuyed) {
  //       setOtpVerified(true);
  //       setShowLoader(true);
  //       setPartsFilled(true);

  //       setTimeout(() => {
  //         setShowLoader(false);
  //         setShowShopInfo(true);
  //       }, 1500); // loader visible for 1.5 seconds
  //     }
  //   }, [route.params])
  // );

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await apiClient.get(`/booking/${bookingId}`);
        setJob(res.data);
      } catch (err) {
        Alert.alert("Error", "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);


  /* ======================================================
     SOCKET LISTENERS
  ====================================================== */


  useEffect(() => {
    // Fired immediately after provider sends part request
    socket.on("tool-request-created", (payload) => {
      console.log("🧰 Part request created:", payload);

      setPartRequest({
        requestId: payload.requestId,
        totalCost: payload.totalCost,
        status: "PENDING",
      });

      setWaitingApproval(true);
    });

    // Fired when USER approves
    socket.on("tool-permission-approved", ({ requestId }) => {
      console.log("✅ User approved part request:", requestId);

      setPartRequest((prev: any) =>
        prev ? { ...prev, status: "APPROVED_BY_USER" } : prev
      );

      setWaitingApproval(false);
    });

    return () => {
      socket.off("tool-request-created");
      socket.off("tool-permission-approved");
    };
  }, []);

useEffect(() => {
  socket.on("toolshop-accepted", (payload) => {
    console.log("🏪 Pickup details received:", payload);
    console.debug("toolshop-accepted payload keys:", Object.keys(payload || {}));

    setPickupDetails({
      requestId: payload.requestId,
      otp: payload.otp,
      shop: payload.shop,
      parts: payload.parts,
      totalCost: payload.totalCost,
    });
  });

  return () => {
    socket.off("toolshop-accepted");
  };
}, []);





  // ✅ Verify OTP
  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 4) {
      Alert.alert("Enter valid OTP");
      return;
    }

    console.log("📤 Emitting verify-start-otp", {
      bookingId: bookingId,
      otp,
    });

    socket.emit("verify-start-otp", {
      bookingId,
      otp,
    });
  };



  useEffect(() => {
    const onOtpSuccess = (booking: any) => {
      console.log("✅ OTP VERIFIED SUCCESS", booking);
      setOtpVerified(true);
    };

    const onOtpFailed = () => {
      console.log("❌ OTP VERIFICATION FAILED");
      Alert.alert("Invalid OTP");
    };

    socket.on("otp-success", onOtpSuccess);
    socket.on("otp-failed", onOtpFailed);

    return () => {
      socket.off("otp-success", onOtpSuccess);
      socket.off("otp-failed", onOtpFailed);
    };
  }, []);

  useEffect(() => {
    socket.on("toolshop-ready-for-pickup", payload => {
      console.log("📣 toolshop-ready-for-pickup payload:", payload);
      setPickupDetails(payload);
    });

    return () => {
      socket.off("toolshop-ready-for-pickup");
    };
  }, []);
  useEffect(() => {
  const onToolOtpVerified = ({ requestId }: any) => {
    console.log("✅ Tool OTP verified for request:", requestId);

    // Hide pickup info
    setPickupDetails(null);

    // Mark parts collected
    setPartsFilled(true);

    // Optional: toast / alert
    Alert.alert("Success", "Parts collected successfully");

    // Now provider continues job
  };

  socket.on("tool-otp-verified", onToolOtpVerified);

  return () => {
    socket.off("tool-otp-verified", onToolOtpVerified);
  };
}, []);





  //✅ Navigate to Parts page
  const handlePartsPress = () => {
    navigation.navigate("PartBuying", { bookingId });

  };

  // ✅ When product is collected → reset the parts state
  const handleProductCollected = () => {
    // setShowShopInfo(false);
    // setPartsFilled(false);
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

  if (!bookingId) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Invalid booking</Text>
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

                {/* If pickup details from toolshop arrive before OTP verification, show them here too */}
                {pickupDetails && (
                  <View style={[styles.shopContainer, { marginTop: 12 }]}> 
                    <Text style={styles.shopName}>Shop: {pickupDetails.shop?.name}</Text>
                    <Text style={styles.shopAddress}>Address: {pickupDetails.shop?.address}</Text>
                    {Array.isArray(pickupDetails.parts) && pickupDetails.parts.map((p: any, i: number) => (
                      <Text key={i}>{p.partName || p.partsname || p.partsname} x {p.quantity}</Text>
                    ))}
                    <Text style={styles.shopOtp}>Pickup OTP: {pickupDetails.otp}</Text>
                  </View>
                )}

                <BottomButton onPress={handleVerifyOtp} title="Verify" widthCount={0.5} />
              </View>
            )}

            {/* ✅ After OTP Verified */}
            {otpVerified && (
              <View style={styles.nextPart}>
                <Text style={styles.successText}>Get started, buddy! </Text>

                {/* 1️⃣ Parts Section */}
                {!partsFilled && !pickupDetails && (
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
                {pickupDetails && (
                  <View style={styles.shopContainer}>
                    <Text style={styles.shopName}>Shop: {pickupDetails.shop.name}</Text>
                    <Text style={styles.shopAddress}>Address: {pickupDetails.shop.address}</Text>
                    {pickupDetails.parts.map(p => (
                      <Text>{p.partName} x {p.quantity}</Text>
                    ))}
                    <Text style={styles.shopOtp}>Pickup OTP: {pickupDetails.otp}</Text>
                    <TouchableOpacity style={styles.collectedButton} onPress={handleProductCollected}>
                      <Text style={styles.collectedText}>Collected</Text>
                    </TouchableOpacity>
                  </View>
                )}



                {partRequest?.status === "PENDING" && (
                  <Text style={{ color: "#d97706", fontWeight: "600" }}>
                    Waiting for user approval...
                  </Text>
                )}
                {partRequest?.status === "APPROVED_BY_USER" && (
                  <Text style={{ color: "green", fontWeight: "700" }}>
                    User approved parts. Waiting for toolshop…
                  </Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#f8f4f4ff' },
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
