import React, { useEffect, useState } from 'react';
import { LiveTrackerModal, EmbeddedTrackingMap } from "../../components/toolshop/LiveTrackerModal";
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
import * as Location from 'expo-location';
import { createOrder, paymentSuccessApi } from '@/api/payment.api';
import { fetchPartRequestById } from '@/api/parts.api';
import { AuthContext } from '@/context/AuthContext';
//const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

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
      // navigation.replace("Razorpay", {
      //   bookingId: bookingId,
      //   amount: job.totalPrice,
      //   orderId: job.razorpayOrderId, // backend should already have it
      // });

      //   navigation.navigate("BookingCompleted", {
      //   bookingId: job._id,
      // });
      navigation.replace("BookingCompleted");

    } catch (err: any) {
      Alert.alert(
        "Payment Failed",
        err?.response?.data?.message || "Something went wrong"
      );
    }
  };
  const handleRazorpayPayment = async () => {
    try {

      const res = await createOrder(bookingId!, Number(job.cost));
      console.log("🧾 Order created:", res.data);
      const orderId = res.data.orderId;



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


      // await paymentSuccessApi({
      //   bookingId: bookingId,
      //   paymentMethod: "RAZORPAY",
      //   // razorpayOrderId: paymentData.razorpay_order_id,
      //   // razorpayPaymentId: paymentData.razorpay_payment_id,
      //   // razorpaySignature: paymentData.razorpay_signature,
      // });

      //Alert.alert("Success", "Payment completed");

      navigation.replace("Razorpay", {
        bookingId,
        amount: res.data.amount,
        orderId: orderId,
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
  const [mapVisible, setMapVisible] = useState(false);
  const [myLocation, setMyLocation] = useState<any>(null);

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
     RESTORE PART REQUEST STATE
  ====================================================== */
  useEffect(() => {
    const restoreState = async () => {
      if (!bookingId) return;

      const request: any = await fetchPartRequestById(bookingId);
      console.log("🔄 Restored part request:", request);

      if (request) {
        setPartRequest(request);

        // If waiting for approval
        if (request.status === "PENDING") {
          setWaitingApproval(true);
        }

        // If approved by user but not yet accepted by shop
        if (request.status === "APPROVED_BY_USER") {
          setWaitingApproval(false);
          // waiting for toolshop accept... (socket will handle)
        }

        // If shop accepted / ready for pickup
        if (
          request.status === "READY_FOR_PICKUP" ||
          (request.status === "ACCEPTED_BY_TOOLSHOP" && request.shopId)
        ) {
          setPickupDetails({
            requestId: request._id,
            otp: request.otp, // Ensure backend returns this if viewer is the assigned provider
            shop: request.selectedToolShop || {}, // Backend should populate this
            parts: request.parts,
            totalCost: request.totalCost,
          });
        }

        // If already collected
        if (request.status === "COLLECTED") {
          setPartsCollected(true);
          setPartsFilled(true);
        }
      }
    };

    restoreState();
  }, [bookingId]);



  /* ======================================================
     LIVE TRACKING (PROVIDER SIDE)
  ====================================================== */

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startTracking = async () => {
      // 1. Check/Request Permissions
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status !== 'granted') {
          console.log('🚫 Location permission denied');
          return;
        }

        // 2. Start Watching
        console.log("🛰️ Starting Live Tracking for Booking:", bookingId);
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (!isMounted) return;
            const { latitude, longitude, heading } = location.coords;

            setMyLocation({ latitude, longitude, heading }); // Update local state for Map Modal

            console.log("📍 Location Emitted:", latitude, longitude);

            // EMIT TO BACKEND
            socket.emit("send-location", {
              bookingId,
              location: {
                latitude,
                longitude,
                heading,
                eta: "10 mins"
              }
            });
          }
        );

        if (isMounted) {
          subscription = sub;
        } else {
          // If unmounted while waiting for promise, remove immediately
          sub.remove();
        }
      } catch (error) {
        console.log("Error starting location tracking:", error);
      }
    };

    if (bookingId && !otpVerified) {
      startTracking();
    }

    return () => {
      isMounted = false;
      console.log("🛑 Stopping Live Tracking");
      try {
        if (subscription) {
          subscription.remove();
        }
      } catch (e) {
        console.log("Error removing location subscription:", e);
      }
    };
  }, [bookingId, otpVerified]);



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
              serviceCategoryName={job?.serviceCategoryName || '-'}
              cost={`₹ ${job?.cost}` || '-'}
              address={job?.address || '-'}
              employeeCount={job?.employeeCount || '1'}
              durationInMinutes={job?.durationInMinutes || 'Not Provided'}
            />

            {/* ✅ OTP Verification Section */}
            {!otpVerified && (
              <View style={styles.otpContainer}>
                {/* Tracking Indicator & Navigation Map */}
                <View style={{ marginBottom: 16, width: '100%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#e3f2fd', padding: 8, borderRadius: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2196F3', marginRight: 8 }} />
                    <Text style={{ color: '#0d47a1', fontWeight: '600' }}>Live Location Active (Navigating...)</Text>
                  </View>

                  {/* EMBEDDED MAP */}
                  <EmbeddedTrackingMap
                    location={myLocation}
                    destination={job?.coordinates ? { latitude: job.coordinates.latitude ?? job.coordinates[1], longitude: job.coordinates.longitude ?? job.coordinates[0] } : undefined}
                    height={250}
                  />
                </View>

                <Text style={styles.subTitle}>
                  Go to the client location and get the OTP to start work!
                </Text>
                <Text style={styles.label}>Enter OTP:</Text>

                <OtpInput onOtpComplete={(code) => setOtp(code)} resendEnabled={false} />

                <BottomButton onPress={handleVerifyOtp} title="Verify" widthCount={0.5} />
              </View>
            )}

            {/* ✅ After OTP Verified */}
            {/* 1️⃣ Parts / Payment Section */}
            {otpVerified && (
              <View style={{ marginVertical: 8 }}>
                <Text style={styles.subTitle}>
                  Continue your job or complete payment
                </Text>

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
            {/* ✅ Pickup Details (Shown regardless of OTP status if available) */}
            {pickupDetails && (
              <View style={[styles.shopContainer, { marginTop: 12 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Parts Ready for Pickup 🏪</Text>
                <Text style={styles.shopName}>Shop: {pickupDetails.shop?.name}</Text>
                <Text style={styles.shopAddress}>Address: {pickupDetails.shop?.address}</Text>

                <View style={{ marginVertical: 8, backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>Items:</Text>
                  {Array.isArray(pickupDetails.parts) && pickupDetails.parts.map((p: any, i: number) => (
                    <Text key={i} style={{ fontSize: 14 }}>• {p.partName || p.partsname || p.partsname} x {p.quantity}</Text>
                  ))}
                  <Text style={{ marginTop: 4, fontWeight: 'bold' }}>Total Cost: ₹{pickupDetails.totalCost}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Text style={styles.shopOtp}>Pickup OTP: </Text>
                  <Text style={[styles.shopOtp, { fontSize: 24, color: theme.colors.primary }]}>{pickupDetails.otp}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#666' }}>Show this OTP to the shop keeper</Text>
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