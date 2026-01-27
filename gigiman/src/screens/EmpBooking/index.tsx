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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
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
import { paymentSuccessApi } from '@/api/payment.api';
import { AuthContext } from '@/context/AuthContext';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

const { width } = Dimensions.get('window');

// ✅ Type-safe route and navigation props
type BookingRouteProp = RouteProp<
  BookingStackParamList,
  "Booking"
>;

type BookingNavProp = NativeStackNavigationProp<
  BookingStackParamList,
  "Booking"
>;

export const EmpBookingScreen = () => {
  const navigation = useNavigation<BookingNavProp>();
  const route = useRoute<BookingRouteProp>();
  const { bookingId } = route.params ?? {};

  const handleCashPayment = async () => {
    try {
      const res = await paymentSuccessApi({
        bookingId: bookingId,
        paymentMethod: "CASH",
      });

      Alert.alert("Success", "Payment completed");
      navigation.navigate("Razorpay", {
        bookingId: bookingId,
        amount: job.totalPrice,
        orderId: job.razorpayOrderId, // backend should already have it
      });

      //   navigation.navigate("BookingCompleted", {
      //   bookingId: job._id,
      // });

    } catch (err: any) {
      Alert.alert(
        "Payment Failed",
        err?.response?.data?.message || "Something went wrong"
      );
    }
  };
  const handleRazorpayPayment = async () => {
    try {
      // const options = {
      //   description: "Gigiman Service Payment",
      //   currency: "INR",
      //   key: RAZORPAY_KEY_ID,
      //   amount: job.totalPrice * 100,
      //   name: "Gigiman",
      //   prefill: {
      //     contact: user.phone,
      //     name: user.fullName,
      //   },
      // };


      await paymentSuccessApi({
        bookingId: bookingId,
        paymentMethod: "RAZORPAY",
        // razorpayOrderId: paymentData.razorpay_order_id,
        // razorpayPaymentId: paymentData.razorpay_payment_id,
        // razorpaySignature: paymentData.razorpay_signature,
      });

      Alert.alert("Success", "Payment completed");

      navigation.navigate("Razorpay", {
        bookingId: bookingId,
        amount: job.totalPrice,
        orderId: job.razorpayOrderId, // backend should already have it
      });

    } catch (err: any) {
      Alert.alert("Payment cancelled or failed");
    }
  };




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
  const [partsCollected, setPartsCollected] = useState(false);

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
        console.log("Started");
        const res = await apiClient.get<{ booking?: any }>(`/booking/${bookingId}`);
        console.log('booking response', (res.data && (res.data as any).booking) ?? res.data);
        // backend returns { success: true, booking: { ... } }
        // prefer the booking payload but fall back to whole response
        const jobPayload = res.data?.booking ?? (res.data as any);
        console.log('job payload ->', jobPayload);
        setJob(jobPayload);
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
    const onToolshopAccepted = (payload: any) => {
      if (partsCollected) {
        console.log("⛔ Ignoring toolshop-accepted (already collected)");
        return;
      }

      console.log("🏪 Pickup details received:", payload);

      setPickupDetails({
        requestId: payload.requestId,
        otp: payload.otp,
        shop: payload.shop,
        parts: payload.parts,
        totalCost: payload.totalCost,
      });
    };

    socket.on("toolshop-accepted", onToolshopAccepted);

    return () => {
      socket.off("toolshop-accepted", onToolshopAccepted);
    };
  }, [partsCollected]);






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
    const onReadyForPickup = (payload: any) => {
      // 🔒 HARD GUARD
      if (partsCollected) {
        console.log("⛔ Ignoring toolshop-ready-for-pickup (already collected)");
        return;
      }

      console.log("📣 toolshop-ready-for-pickup payload:", payload);

      setPickupDetails({
        requestId: payload.requestId,
        otp: payload.otp,
        shop: payload.shop,
        parts: payload.parts,
        totalCost: payload.totalCost,
      });
    };

    socket.on("toolshop-ready-for-pickup", onReadyForPickup);

    return () => {
      socket.off("toolshop-ready-for-pickup", onReadyForPickup);
    };
  }, [partsCollected]);

  useEffect(() => {
    const onToolOtpVerified = ({ requestId }: any) => {
      console.log("✅ Tool OTP verified for request:", requestId);
      setPartsCollected(true);
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
    setPartsCollected(true);
    setPickupDetails(null);
    setPartsFilled(true);
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
        <Text>No booking</Text>
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
            {/* 1️⃣ Parts / Payment Section */}
            {otpVerified && !pickupDetails && (
              <View style={{ marginVertical: 8 }}>
                <Text style={styles.subTitle}>
                  Continue your job or complete payment
                </Text>

                {/* {!partsCollected && (
                  <BottomButton
                    title="Add Parts"
                    onPress={handlePartsPress}
                    widthCount={0.4}
                  />
                )} */}

                <BottomButton
                    title="Add Parts"
                    onPress={handlePartsPress}
                    widthCount={0.4}
                  />

                <BottomButton
                  title="Pay & Complete (Cash)"
                  onPress={handleCashPayment}
                  widthCount={0.6}
                />

                <BottomButton
                  title="Pay Online & Complete"
                  onPress={handleRazorpayPayment}
                  widthCount={0.6}
                />
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
  },
  label: { color: theme.colors.text, ...theme.typography.body },
  nextPart: {
    flex: 1,
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
