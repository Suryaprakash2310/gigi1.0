import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
  Vibration,
  DeviceEventEmitter,
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
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useProviderBooking } from '@/context/ProviderBookingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initiateMaskedCall } from '@/api/call.api';

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
      await setActiveBookingId(null);
      console.log("🗑 Active booking removed");
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




  //console.log("🧭 bookingId:", bookingId);




  // ✅ State
  const [otp, setOtp] = useState('');
  // const [otpVerified, setOtpVerified] = useState(false);
  const [partsFilled, setPartsFilled] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  //const [pickupDetails, setPickupDetails] = useState<any | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  //const [partRequest, setPartRequest] = useState<any>(null);
  //const [waitingApproval, setWaitingApproval] = useState(false);
  // const [partsCollected, setPartsCollected] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [myLocation, setMyLocation] = useState<any>(null);
  const [userLiveLocation, setUserLiveLocation] = useState<any>(null);

  //const [waitingServiceApproval, setWaitingServiceApproval] = useState(false);
  const {
    otpVerified,
    pickupDetails,
    setPickupDetails,
    setOtpVerified,
    waitingApproval,
    setWaitingApproval,
    setWaitingServiceApproval,
    waitingServiceApproval,
    partRequest,
    setPartRequest,
    activeBookingId,
    setActiveBookingId,
    partsCollected,
    setPartsCollected,
  } = useProviderBooking();

  const [calling, setCalling] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);

  const confirmCall = () => {
    Alert.alert(
      "Call Customer?",
      "This will connect you securely via a masked number for your privacy.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: handleMaskedCall }
      ]
    );
  };

  const handleMaskedCall = async () => {
    if (!bookingId) return;

    // Cooldown check (30 seconds)
    const now = Date.now();
    if (now - lastCallTime < 30000) {
      const remaining = Math.ceil((30000 - (now - lastCallTime)) / 1000);
      Alert.alert("Please wait", `Please wait ${remaining} seconds before calling again.`);
      return;
    }

    try {
      setCalling(true);
      Vibration.vibrate(100);
      console.log("[API CALL] 📞 Initiating masked call:", bookingId);

      await initiateMaskedCall(bookingId);

      console.log("[API RESPONSE] ✅ Mask call success");
      setLastCallTime(Date.now());
      Alert.alert(
        "Calling...",
        "Connecting you securely via masked number. Please keep your phone lines free."
      );
    } catch (err: any) {
      console.log("❌ Mask call error:", err?.response?.data || err);
      Alert.alert(
        "Call Failed",
        err?.response?.data?.message || "Unable to initiate call"
      );
    } finally {
      setCalling(false);
    }
  };



  // 🛡 Removed redundant local checkOtpStatus that caused OTP bypass.
  // The screen now relies on the persistent otpVerified state from ProviderBookingContext.
  useEffect(() => {
    if ((route.params as any)?.serviceWaiting) {
      setWaitingServiceApproval(true);
    }
  }, [route.params]);


  /* ======================================================
     AUTHORITATIVE STATE HYDRATION
     Called on mount AND after every socket reconnect.
     API is the single source of truth — AsyncStorage is
     only a cache of last-known state.
  ====================================================== */
  const hydrateFromApi = async (id: string) => {
    try {
      console.log("🔄 hydrateFromApi:", id);

      // ── 1. Fetch booking ──────────────────────────────
      const res = await apiClient.get<{ booking?: any }>(`/booking/${id}`);
      const jobPayload = res.data?.booking ?? (res.data as any);
      const status: string = jobPayload?.status ?? "";
      const normalizedStatus = status.toLowerCase();

      // 🔍 Debug — confirm exactly what backend returned
      console.log("📊 Backend job status:", status);
      console.log("🔎 Normalized status:", normalizedStatus);
      setJob(jobPayload);

      // Shared status constants — single source of truth for comparisons
      const BOOKING_STATUS = {
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
      } as const;

      // Always set explicitly (true OR false) to overwrite any stale context value
      if (normalizedStatus === BOOKING_STATUS.IN_PROGRESS) {
        setOtpVerified(true);
        console.log("✅ hydrateFromApi: OTP already verified (status:", status, ")");
      } else if (normalizedStatus === BOOKING_STATUS.COMPLETED) {
        // Job finished while we were offline — navigate away
        console.log("🏁 hydrateFromApi: booking already completed, navigating");
        navigation.replace("BookingCompleted" as any);
        return;
      } else {
        // Any other status → OTP not yet verified, show OTP screen
        setOtpVerified(false);
        console.log("⏳ hydrateFromApi: OTP not yet verified (status:", status, ")");
      }

      // ── 2. Fetch part-request ─────────────────────────
      try {
        const request: any = await fetchPartRequestById(id);
        console.log("🔄 Restored part request:", request?.status);

        if (request) {
          setPartRequest(request);

          if (request.status === "PENDING") {
            setWaitingApproval(true);
          }

          if (request.status === "APPROVED_BY_USER") {
            setWaitingApproval(false);
          }

          if (
            (request.status === "READY_FOR_PICKUP" ||
              request.status === "ACCEPTED_BY_TOOLSHOP") &&
            request.shopId &&
            !partsCollected
          ) {
            setPickupDetails({
              requestId: request._id,
              otp: request.otp,
              shop: request.selectedToolShop || {},
              parts: request.parts,
              totalCost: request.totalCost,
            });
          }

          if (request.status === "COLLECTED") {
            setPartsCollected(true);
            setPartsFilled(true);
            setPickupDetails(null);
          }
        }
      } catch (partErr) {
        // Part request may not exist yet — not an error
        console.log("ℹ No part request found for booking:", id);
      }
    } catch (err) {
      console.error("❌ hydrateFromApi failed:", err);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount
  useEffect(() => {
    if (bookingId) {
      hydrateFromApi(bookingId);
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  // Re-run whenever the socket reconnects (catches all missed events)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("socket:reconnected", () => {
      if (bookingId) {
        console.log("🔁 Socket reconnected — re-hydrating state from API");
        hydrateFromApi(bookingId);
      }
    });
    return () => sub.remove();
  }, [bookingId]);




  const myLiveLocation = useLiveTracking(bookingId, !otpVerified);

  useEffect(() => {
    if (bookingId) {
      console.log("🔌 Joining tracking room (Emp):", bookingId);
      socket.emit("join-tracking", { bookingId });
    }
  }, [bookingId]);


  /* ======================================================
     SOCKET LISTENERS
  ====================================================== */


  //useEffect(() => {
  // Fired immediately after provider sends part request
  // socket.on("tool-request-created", (payload) => {
  //   console.log("🧰 Part request created:", payload);

  //   setPartRequest({
  //     requestId: payload.requestId,
  //     totalCost: payload.totalCost,
  //     status: "PENDING",
  //   });

  //   setWaitingApproval(true);
  // });

  // Fired when USER approves
  // socket.on("tool-permission-approved", ({ requestId }) => {
  //   console.log("✅ User approved part request:", requestId);

  //   setPartRequest((prev: any) =>
  //     prev ? { ...prev, status: "APPROVED_BY_USER" } : prev
  //   );

  //   setWaitingApproval(false);
  // });

  //return () => {
  // socket.off("tool-request-created");
  //socket.off("tool-permission-approved");
  //};
  //}, []);

  useEffect(() => {
    if (!bookingId) return;

    const handleUserLocationUpdate = (data: any) => {
      console.log("📍 Servicer received user live location:", data);
      if (data.bookingId === bookingId && data.latitude && data.longitude) {
        setUserLiveLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading
        });
      }
    };

    socket.on("user-location-update", handleUserLocationUpdate);

    return () => {
      socket.off("user-location-update", handleUserLocationUpdate);
    };
  }, [bookingId]);

  // 🚀 Set active booking when entering screen to enable restoration
  useEffect(() => {
    if (bookingId && activeBookingId !== bookingId) {
      setActiveBookingId(bookingId);
    }
  }, [bookingId]);
  // useEffect(() => {
  //   const onToolshopAccepted = (payload: any) => {
  //     if (partsCollected) {
  //       console.log("⛔ Ignoring toolshop-accepted (already collected)");
  //       return;
  //     }

  //     console.log("🏪 Pickup details received:", payload);

  //     setPickupDetails({
  //       requestId: payload.requestId,
  //       otp: payload.otp,
  //       shop: payload.shop,
  //       parts: payload.parts,
  //       totalCost: payload.totalCost,
  //     });
  //   };

  //   socket.on("toolshop-accepted", onToolshopAccepted);

  //   return () => {
  //     socket.off("toolshop-accepted", onToolshopAccepted);
  //   };
  // }, [partsCollected]);

  useEffect(() => {
    const onServiceApproved = ({ bookingId: id }: any) => {
      if (id !== bookingId) return;

      console.log("✅ Service approved by user");
      setWaitingServiceApproval(false);
    };

    const onServiceRejected = ({ bookingId: id }: any) => {
      if (id !== bookingId) return;

      console.log("❌ Service rejected by user");
      setWaitingServiceApproval(false);

      Alert.alert("Customer Rejected", "Continue with original service.");
    };

    socket.on("service-approved", onServiceApproved);
    socket.on("service-rejected", onServiceRejected);

    return () => {
      socket.off("service-approved", onServiceApproved);
      socket.off("service-rejected", onServiceRejected);
    };
  }, [bookingId]);






  // ✅ Verify OTP
  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 4) {
      Alert.alert("Enter valid OTP");
      return;
    }

    console.log("📤 Sending OTP:", otp);
    console.log("📤 bookingId:", bookingId);
    socket.emit("verify-start-otp", {
      bookingId,
      otp,
    });
  };



  // useEffect(() => {
  //   const onOtpSuccess = async (booking: any) => {
  //     console.log("✅ OTP VERIFIED SUCCESS", booking);
  //     // Save active booking
  //   if (bookingId) {
  //     await AsyncStorage.setItem("activeBookingId", bookingId);
  //     console.log("💾 Saved active booking:", bookingId);
  //   }
  //   };

  //   const onOtpFailed = () => {
  //     console.log("❌ OTP VERIFICATION FAILED");
  //     Alert.alert("Invalid OTP");
  //   };

  //   socket.on("otp-success", onOtpSuccess);
  //   socket.on("otp-failed", onOtpFailed);

  //   return () => {
  //     socket.off("otp-success", onOtpSuccess);
  //     socket.off("otp-failed", onOtpFailed);
  //   };
  // }, []);


  useEffect(() => {
    const onOtpSuccess = async (payload: any) => {
      // 🔒 Guard: only grant access if the success is for THIS booking
      const incomingId = payload?.bookingId ?? payload?._id ?? payload?.booking?._id;
      if (incomingId && incomingId !== bookingId) {
        console.log("⚠ Ignoring otp-success for unrelated booking:", incomingId);
        return;
      }

      console.log("✅ OTP VERIFIED SUCCESS");

      setOtpVerified(true); // 🔥 IMPORTANT (don't forget this)

      if (bookingId) {
        await setActiveBookingId(bookingId);
        console.log("💾 Saved active booking:", bookingId);
      }
    };

    const onOtpFailed = () => {
      console.log("❌ OTP VERIFICATION FAILED");
      Alert.alert("Invalid OTP");
    };

    socket.on("otp-success", onOtpSuccess);

    // 🔥 FIX: match backend event name
    socket.on("start-otp-failed", onOtpFailed);

    return () => {
      socket.off("otp-success", onOtpSuccess);
      socket.off("start-otp-failed", onOtpFailed);
    };
  }, [bookingId]);
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

  if (!bookingId || (!loading && !job)) {
    return (
      <View style={styles.container}>
        <AppHeader title="Booking" />
        <View style={styles.noBookingContainer}>
          <View style={styles.noBookingIconCircle}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.noBookingTitle}>No Active Booking</Text>
          <Text style={styles.noBookingSubtitle}>
            You don't have any bookings at the moment. New requests will appear here once assigned to you.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => navigation.navigate("Home" as any)}
          >
            <Text style={styles.refreshButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
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

            {/* ⚠ Report Issue Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFF3E0',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: '#FFE0B2'
              }}
              onPress={() => (navigation as any).navigate("ProfileTab", { screen: "RaiseIssue", params: { bookingId } })}
            >
              <Ionicons name="warning" size={20} color="#E65100" />
              <Text style={{ marginLeft: 8, color: '#E65100', fontWeight: '700', fontSize: 15 }}>
                Report Issue
              </Text>
            </TouchableOpacity>

            {/* 📞 Masked Call Button */}
            <TouchableOpacity
              style={[styles.callBtn, calling && { opacity: 0.6 }]}
              onPress={confirmCall}
              disabled={calling}
            >
              <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                {calling ? "Connecting..." : "Call Customer"}
              </Text>
            </TouchableOpacity>

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
                    location={myLiveLocation}
                    destination={userLiveLocation || (job?.coordinates ? { latitude: job.coordinates.latitude ?? job.coordinates[1], longitude: job.coordinates.longitude ?? job.coordinates[0] } : undefined)}
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
              <View style={{ marginVertical: 16 }}>
                <Text style={[styles.subTitle, { marginBottom: 12 }]}>
                  Job Actions & Completion
                </Text>

                {/* 🛠 Action Cards Grid */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={handlePartsPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionCardIcon, { backgroundColor: '#E0F2F1' }]}>
                      <Ionicons name="construct-sharp" size={24} color="#00796B" />
                    </View>
                    <Text style={styles.actionCardTitle}>Add Parts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionCard, waitingServiceApproval && { opacity: 0.6 }]}
                    onPress={() =>
                      !waitingServiceApproval &&
                      navigation.navigate("AddService", {
                        bookingId,
                        domainServiceId: job?.domainServiceId,
                      })
                    }
                    disabled={waitingServiceApproval}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionCardIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="add-circle-sharp" size={26} color="#1976D2" />
                    </View>
                    <Text style={styles.actionCardTitle}>
                      {waitingServiceApproval ? "Waiting..." : "Add Service"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {waitingServiceApproval && (
                  <View style={styles.waitingBanner}>
                    <Ionicons name="time-outline" size={18} color="#92400E" style={{ marginRight: 8 }} />
                    <Text style={styles.waitingText}>
                      Waiting for customer approval…
                    </Text>
                  </View>
                )}

                {/* 💳 Payment & Completion Section */}
                <View style={styles.paymentSection}>
                  <Text style={styles.paymentTitle}>Payment & Completion</Text>

                  <TouchableOpacity
                    style={[styles.paymentButton, styles.cashButton]}
                    onPress={handleCashPayment}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentIconCircle}>
                      <Ionicons name="cash-outline" size={22} color="#166534" />
                    </View>
                    <Text style={[styles.paymentButtonText, { color: '#166534' }]}>Pay & Complete (Cash)</Text>
                    <Ionicons name="chevron-forward" size={18} color="#166534" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.paymentButton, styles.onlineButton]}
                    onPress={handleRazorpayPayment}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentIconCircle}>
                      <Ionicons name="card-outline" size={22} color="#1e40af" />
                    </View>
                    <Text style={[styles.paymentButtonText, { color: '#1e40af' }]}>Pay Online & Complete</Text>
                    <Ionicons name="chevron-forward" size={18} color="#1e40af" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {/* ✅ Pickup Details (Shown regardless of OTP status if available) */}
            {pickupDetails && !partsCollected && (
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
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  actionCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  paymentSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2e4a',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cashButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  onlineButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  paymentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 1,
  },
  paymentButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
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
  callBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noBookingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
    backgroundColor: '#fff',
  },
  noBookingIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fdf2ee', // light theme primary tint
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noBookingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a2e4a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noBookingSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  waitingBanner: {
    backgroundColor: "#FEF9C3",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  waitingText: {
    color: "#92400E",
    fontWeight: "600",
    textAlign: "center",
  },
});