import React, { useEffect, useState, useContext, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
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
  Animated,
  PanResponder,
  Modal,
  StatusBar,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserDetailContainer } from './UserDetailContainer';
import { theme } from '../../theme/theme';
import { RouteNavigationInfo } from '@/utils/navigation.utils';
import AppHeader from '../../components/AppHeader';
import OtpInput from '../../components/OtpInput';

import BottomButton from '../../components/Bottom';
import { BookingStackParamList } from '../../navigation/EmpBookingStack';
import { AppStackParamList } from '../../navigation/EmployeeStack';
import { socket } from '@/socket/socket';
import apiClient from '@/api/client';
import * as Location from 'expo-location';
import { parseCoordinates, reverseGeocodeCoordinates } from '@/utils/location';
import { createOrder, paymentSuccessApi } from '@/api/payment.api';
import { fetchPartRequestById } from '@/api/parts.api';
import { AuthContext } from '@/context/AuthContext';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useProviderBooking } from '@/context/ProviderBookingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initiateMaskedCall } from '@/api/call.api';
import { ProfileContext } from '@/context/ProfileContext';
import { formatBookingId } from '@/utils/booking.utils';

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
    resetBookingState,
    partsCollected,
    setPartsCollected,
  } = useProviderBooking();

  // 🔄 Route param takes priority, falls back to active booking from context/storage
  const bookingId = route.params?.bookingId || activeBookingId;

  // ✅ State
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partsFilled, setPartsFilled] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [myLocation, setMyLocation] = useState<any>(null);
  const [userLiveLocation, setUserLiveLocation] = useState<any>(null);

  // Billing calculations
  const totalCost = Number(job?.totalPrice ?? job?.totalCost ?? job?.cost ?? job?.price ?? job?.amount ?? 0);
  const advancePaid = Number(job?.advancePayment ?? job?.advancePaid ?? job?.advanceAmount ?? job?.advance ?? 0);
  const normalizedPaymentStatus = String(job?.paymentStatus || "").toLowerCase();

  // Check if fully paid
  const isPaidStatus = normalizedPaymentStatus === "paid" || job?.isPaid === true;
  const isAdvanceCovered = advancePaid > 0 && advancePaid >= totalCost;
  const isZeroRemaining = job?.remainingAmount !== undefined ? Number(job?.remainingAmount) <= 0 : false;

  const isFullPayment = isPaidStatus || isAdvanceCovered || (totalCost > 0 && isZeroRemaining);
  const remainingAmount = isFullPayment ? 0 : (job?.remainingAmount !== undefined ? Number(job?.remainingAmount) : Math.max(0, totalCost - advancePaid));

  const handleCashPayment = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await paymentSuccessApi({
        bookingId: bookingId,
        paymentMethod: "CASH",
      });

      Alert.alert("Success", "Payment completed");
      resetBookingState();
      navigation.replace("BookingCompleted");

    } catch (err: any) {
      Alert.alert(
        "Payment Failed",
        err?.response?.data?.message || "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const paymentAmount = advancePaid > 0 ? remainingAmount : totalCost;
      const res = await createOrder(bookingId!, paymentAmount);
      const orderId = res.data.orderId;

      navigation.replace("Razorpay", {
        bookingId,
        amount: res.data.amount,
        orderId: orderId,
      });

    } catch (err: any) {
      Alert.alert("Payment cancelled or failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectComplete = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await paymentSuccessApi({
        bookingId: bookingId!,
        paymentMethod: "CASH", // complete the order directly since it's fully paid
      });

      Alert.alert("Success", "Order completed successfully");
      resetBookingState();
      navigation.replace("BookingCompleted");

    } catch (err: any) {
      Alert.alert(
        "Completion Failed",
        err?.response?.data?.message || "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const { profile } = useContext(ProfileContext);
  const isLeader = !job?.teamLeader || (profile && job.teamLeader._id === profile._id);

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

      await initiateMaskedCall(bookingId);

      setLastCallTime(Date.now());
      Alert.alert(
        "Calling...",
        "Connecting you securely via masked number. Please keep your phone lines free."
      );
    } catch (err: any) {
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
  const hydrateFromApi = async (id: string, retries = 3): Promise<void> => {
    try {
      // ── 1. Fetch booking ──────────────────────────────
      const res = await apiClient.get<{ booking?: any }>(`/booking/${id}`);
      const jobPayload = res.data?.booking ?? (res.data as any)?.data?.booking ?? (res.data as any)?.data ?? res.data;
      const status: string = jobPayload?.status ?? "";
      const normalizedStatus = status.toLowerCase();

      // 🔍 Reverse geocode if address is "current_location" or coordinates
      const parsedCoords = parseCoordinates(jobPayload) || (jobPayload?.address ? parseCoordinates(jobPayload.address) : null);
      let resolvedAddress = jobPayload?.address;
      const addrLower = typeof resolvedAddress === 'string' ? resolvedAddress.toLowerCase().trim() : '';
      const isGenericAddress =
        !resolvedAddress ||
        addrLower === 'current_location' ||
        addrLower === 'current location' ||
        addrLower.startsWith('coordinates:') ||
        /^[-0-9.,\s]+$/.test(addrLower);

      if (isGenericAddress && parsedCoords) {
        try {
          const geocodeResult = await reverseGeocodeCoordinates(parsedCoords);
          if (geocodeResult) {
            resolvedAddress = geocodeResult;
          }
        } catch (e) {
          // Ignore reverse geocode error
        }
      }
      if (jobPayload && typeof jobPayload === 'object') {
        jobPayload.address = resolvedAddress;
        if (parsedCoords) {
          jobPayload.resolvedCoords = parsedCoords;
        }
      }

      setJob(jobPayload);

      // Shared status constants — single source of truth for comparisons
      const BOOKING_STATUS = {
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
      } as const;

      // Restore trip / arrival state from AsyncStorage & live backend status
      const [savedTripStarted, savedHasArrived] = await Promise.all([
        AsyncStorage.getItem(`@trip_started_${id}`),
        AsyncStorage.getItem(`@has_arrived_${id}`),
      ]);

      if (
        savedHasArrived === "true" ||
        normalizedStatus === "arrived" ||
        jobPayload?.hasArrived ||
        jobPayload?.servicerStatus === "arrived"
      ) {
        setTripStarted(true);
        setHasArrived(true);
      } else if (
        savedTripStarted === "true" ||
        normalizedStatus === "on_the_way" ||
        normalizedStatus === "trip_started" ||
        jobPayload?.tripStarted ||
        jobPayload?.servicerStatus === "on_the_way"
      ) {
        setTripStarted(true);
      }

      // Always set explicitly (true OR false) to overwrite any stale context value
      if (normalizedStatus === BOOKING_STATUS.IN_PROGRESS) {
        setOtpVerified(true);
      } else if (normalizedStatus === BOOKING_STATUS.COMPLETED) {
        resetBookingState();
        await setActiveBookingId(null);
        await AsyncStorage.removeItem("activeBookingId");
        await AsyncStorage.removeItem("otpVerified");

        // Check if there is an active ongoing booking on the server
        try {
          const activeRes = await apiClient.get<any>("/booking/active/servicer");
          const ongoingJob = activeRes.data?.booking;
          if (ongoingJob?._id && ongoingJob._id !== id) {
            const ongoingStatus = (ongoingJob.status || "").toLowerCase();
            if (ongoingStatus !== "completed" && ongoingStatus !== "cancelled" && ongoingStatus !== "canceled" && ongoingStatus !== "rejected") {
              setActiveBookingId(ongoingJob._id);
              await hydrateFromApi(ongoingJob._id);
              return;
            }
          }
        } catch (e) {
          // Ignore error
        }

        setJob(null);
        setLoading(false);
        return;
      } else if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "canceled" ||
        normalizedStatus === "rejected"
      ) {
        resetBookingState();
        await setActiveBookingId(null);
        await AsyncStorage.removeItem("activeBookingId");
        await AsyncStorage.removeItem("otpVerified");

        // Check if there is an active ongoing booking on the server
        try {
          const activeRes = await apiClient.get<any>("/booking/active/servicer");
          const ongoingJob = activeRes.data?.booking;
          if (ongoingJob?._id && ongoingJob._id !== id) {
            const ongoingStatus = (ongoingJob.status || "").toLowerCase();
            if (ongoingStatus !== "completed" && ongoingStatus !== "cancelled" && ongoingStatus !== "canceled" && ongoingStatus !== "rejected") {
              setActiveBookingId(ongoingJob._id);
              await hydrateFromApi(ongoingJob._id);
              return;
            }
          }
        } catch (e) {}

        Alert.alert("Booking Unavailable", "This booking was cancelled or rejected.");
        setJob(null);
        setLoading(false);
        (navigation.getParent() as any)?.navigate("Home") || navigation.navigate("Home" as any);
        return;
      } else {
        // Any other status → OTP not yet verified, show OTP screen
        setOtpVerified(false);
      }

      // ── 2. Fetch part-request ─────────────────────────
      try {
        const request: any = await fetchPartRequestById(id);

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
      }
    } catch (err: any) {
      if (err?.response?.status === 403 && retries > 0) {
        // Socket acceptance event may still be persisting to DB on the server
        await new Promise((res) => setTimeout(res, 600));
        return hydrateFromApi(id, retries - 1);
      }
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        resetBookingState();
        await setActiveBookingId(null);
        await AsyncStorage.removeItem("activeBookingId");
        await AsyncStorage.removeItem("otpVerified");
        if (err?.response?.status === 403) {
          Alert.alert("Access Denied", "You are not authorized to view this booking.");
        } else {
          Alert.alert("Booking Not Found", "This booking is no longer active or was removed.");
        }
        setJob(null);
        (navigation.getParent() as any)?.navigate("Home") || navigation.navigate("Home" as any);
      } else {
        Alert.alert("Error", "Failed to load booking details");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Authoritative Booking ID Recovery & Hydration
  useEffect(() => {
    let isMounted = true;

    const resolveAndHydrate = async () => {
      let targetId = route.params?.bookingId || activeBookingId;

      // 1. Fallback: check AsyncStorage directly in case context is still restoring
      if (!targetId) {
        try {
          const storedId = await AsyncStorage.getItem("activeBookingId");
          if (storedId) {
            targetId = storedId;
            setActiveBookingId(storedId);
          }
        } catch (e) {
          // Ignore read error
        }
      }

      // 2. Fallback: query dedicated /booking/active/servicer endpoint
      if (!targetId) {
        try {
          const activeRes = await apiClient.get<any>("/booking/active/servicer");
          if (activeRes.data?.booking?._id) {
            targetId = activeRes.data.booking._id;
            setActiveBookingId(targetId);
          }
        } catch (e) {
          // Ignore fetch error
        }
      }

      // 3. Fallback: query /booking/history/servicer for any active/in-progress booking
      if (!targetId) {
        try {
          const historyRes = await apiClient.get<any>("/booking/history/servicer");
          const list = historyRes.data?.bookings || [];
          const activeJob = list.find((b: any) => {
            const s = (b.status || "").toLowerCase();
            return (
              s === "in_progress" ||
              s === "ongoing" ||
              s === "accepted" ||
              s === "pending" ||
              s === "arrived" ||
              s === "on_the_way" ||
              s === "trip_started"
            );
          });
          if (activeJob?._id) {
            targetId = activeJob._id;
            setActiveBookingId(activeJob._id);
          }
        } catch (e) {
          // Ignore error
        }
      }

      if (!isMounted) return;

      if (targetId) {
        setActiveBookingId(targetId);
        await hydrateFromApi(targetId);
      } else {
        setJob(null);
        setLoading(false);
      }
    };

    setLoading(true);
    resolveAndHydrate();

    return () => {
      isMounted = false;
    };
  }, [route.params?.bookingId, activeBookingId]);

  // Re-run whenever the socket reconnects (catches all missed events)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("socket:reconnected", () => {
      if (bookingId) {
        hydrateFromApi(bookingId);
      }
    });
    return () => sub.remove();
  }, [bookingId]);




  const myLiveLocation = useLiveTracking(bookingId, !otpVerified);

  useEffect(() => {
    if (bookingId) {
      socket.emit("join-tracking", { bookingId });
    }
  }, [bookingId]);


  /* ======================================================
     SOCKET LISTENERS
  ====================================================== */

  useEffect(() => {
    if (!bookingId) return;

    const handleUserLocationUpdate = (data: any) => {
      const isMatching = !data.bookingId || String(data.bookingId) === String(bookingId);
      if (isMatching) {
        const coords = parseCoordinates(data);
        if (coords) {
          setUserLiveLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            heading: data.heading || 0,
          });
        }
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

  useEffect(() => {
    const onServiceApproved = ({ bookingId: id, service, totalPrice }: any) => {
      if (id !== bookingId) return;

      setWaitingServiceApproval(false);

      // Update Job state to reflect new service and cost
      if (totalPrice || service) {
        setJob((prev: any) => prev ? {
          ...prev,
          cost: totalPrice || prev.cost,
          serviceCategoryName: service || prev.serviceCategoryName
        } : prev);
      }
    };

    const onServiceRejected = ({ bookingId: id }: any) => {
      if (id !== bookingId) return;

      setWaitingServiceApproval(false);

      Alert.alert("Customer Rejected", "Continue with original service.");
    };

    const onExtraServiceResponse = ({ bookingId: id, status, totalPrice, extraServices }: any) => {
      if (id !== bookingId) return;
      setWaitingServiceApproval(false);

      if (status === "APPROVED") {
        setJob((prev: any) => prev ? {
          ...prev,
          cost: totalPrice,
          extraServices: extraServices
        } : prev);
        Alert.alert("Success", "Extra service approved and added to bill.");
      } else if (status === "REJECTED") {
        Alert.alert("Rejected", "Extra service proposal was rejected by customer.");
        // We might want to update the local extraServices array to move it to REJECTED 
        // if we want to show rejection in real-time without fetching from API
        if (extraServices) {
          setJob((prev: any) => prev ? { ...prev, extraServices } : prev);
        }
      }
    };

    socket.on("service-approved", onServiceApproved);
    socket.on("service-rejected", onServiceRejected);
    socket.on("extra-service-response", onExtraServiceResponse);

    return () => {
      socket.off("service-approved", onServiceApproved);
      socket.off("service-rejected", onServiceRejected);
      socket.off("extra-service-response", onExtraServiceResponse);
    };
  }, [bookingId]);

  // ===============================
  // TIME-BASED SERVICE TIMER STATE
  // ===============================
  const [timerData, setTimerData] = useState<{
    isTimeBased?: boolean;
    timerStatus?: string;
    remainingSeconds?: number;
    extraRemainingSeconds?: number;
    overtimeSeconds?: number;
    totalDurationMinutes?: number;
  } | null>(null);
  const [isTimerLoading, setIsTimerLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTimerStatus = async () => {
      try {
        setIsTimerLoading(true);
        const res = await apiClient.get(`/booking/${bookingId}/timer-status`);
        if (isMounted && res.data?.timerStatus) {
          setTimerData(res.data.timerStatus);
        }
      } catch (err) {
        // Silently handle if not time-based or offline
      } finally {
        if (isMounted) {
          setIsTimerLoading(false);
        }
      }
    };

    if (otpVerified || job?.status === 'in_progress') {
      fetchTimerStatus();
      if (socket && bookingId) {
        socket.emit("get-timer-status", { bookingId });
      }
    }

    const onTimerStatus = (data: any) => {
      if (data && (!data.bookingId || String(data.bookingId) === String(bookingId))) {
        setTimerData(data);
        setIsTimerLoading(false);
      }
    };

    socket.on("service-timer-started", onTimerStatus);
    socket.on("booking-timer-status", onTimerStatus);
    socket.on("extra-timer-extended", (data: any) => {
      if (data?.timerStatus) {
        setTimerData(data.timerStatus);
        setIsTimerLoading(false);
      }
    });

    return () => {
      isMounted = false;
      socket.off("service-timer-started", onTimerStatus);
      socket.off("booking-timer-status", onTimerStatus);
      socket.off("extra-timer-extended");
    };
  }, [bookingId, otpVerified, job?.status]);

  // Real-time ticker
  useEffect(() => {
    const isServiceRunning = otpVerified || job?.status === 'in_progress';
    const isApplicable = timerData?.isTimeBased || job?.durationInMinutes || job?.workingHours;

    if (!isApplicable || !isServiceRunning || timerData?.timerStatus === 'COMPLETED' || timerData?.timerStatus === 'IDLE') {
      return;
    }

    const interval = setInterval(() => {
      setTimerData((prev: any) => {
        const bookedDuration = prev?.totalDurationMinutes || (job?.durationInMinutes ? Number(job.durationInMinutes) : (job?.workingHours ? parseInt(String(job.workingHours)) : 60));

        if (!prev) {
          return {
            isTimeBased: true,
            timerStatus: 'RUNNING',
            remainingSeconds: Math.max(0, bookedDuration * 60 - 1),
            extraRemainingSeconds: 0,
            overtimeSeconds: 0,
            totalDurationMinutes: bookedDuration,
          };
        }

        const currentStatus = prev.timerStatus || 'RUNNING';

        if (currentStatus === 'RUNNING') {
          const currentRemaining = prev.remainingSeconds !== undefined ? prev.remainingSeconds : (bookedDuration * 60);
          if (currentRemaining > 1) {
            return { ...prev, isTimeBased: true, remainingSeconds: currentRemaining - 1 };
          } else {
            return {
              ...prev,
              isTimeBased: true,
              timerStatus: 'EXTRA_TIME_RUNNING',
              remainingSeconds: 0,
              extraRemainingSeconds: 600,
              extraTimeMinutes: 10,
            };
          }
        }

        if (currentStatus === 'EXTRA_TIME_RUNNING') {
          const currentExtra = prev.extraRemainingSeconds !== undefined ? prev.extraRemainingSeconds : 600;
          if (currentExtra > 1) {
            return { ...prev, isTimeBased: true, extraRemainingSeconds: currentExtra - 1 };
          } else {
            return {
              ...prev,
              isTimeBased: true,
              timerStatus: 'OVERTIME_RUNNING',
              extraRemainingSeconds: 0,
              overtimeSeconds: 1,
            };
          }
        }

        if (currentStatus === 'OVERTIME_RUNNING') {
          return { ...prev, isTimeBased: true, overtimeSeconds: (prev.overtimeSeconds || 0) + 1 };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerData?.isTimeBased, timerData?.timerStatus, otpVerified, job?.status, job?.durationInMinutes, job?.workingHours]);

  const formatTimerSeconds = (totalSecs: number = 0) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };






  const [tripStarted, setTripStarted] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  // Screen & Bottom Sheet state for Pre-OTP live map navigation
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const COLLAPSED_HEIGHT = 155;
  const HALF_HEIGHT = Math.round(SCREEN_HEIGHT * 0.52);
  const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.88);

  // Route calculation info with Turn-by-Turn Maneuvers
  const [routeInfo, setRouteInfo] = useState<RouteNavigationInfo | null>(null);
  const [showTurnsModal, setShowTurnsModal] = useState(false);

  const getTurnIconName = (modifier?: string, type?: string): keyof typeof Ionicons.glyphMap => {
    const mod = (modifier || '').toLowerCase();
    const typ = (type || '').toLowerCase();
    if (typ === 'arrive') return 'flag';
    if (mod === 'uturn') return 'refresh';
    if (mod.includes('left')) return 'arrow-undo';
    if (mod.includes('right')) return 'arrow-redo';
    return 'arrow-up';
  };

  const getEstimatedArrival = (durationStr?: string) => {
    if (!durationStr) return null;
    const mins = parseInt(durationStr);
    if (isNaN(mins) || mins <= 0) return null;
    const d = new Date(Date.now() + mins * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [sheetMode, setSheetMode] = useState<'collapsed' | 'half' | 'expanded'>('half');
  const sheetHeightAnim = useRef(new Animated.Value(Math.round(SCREEN_HEIGHT * 0.52))).current;

  const animateToHeight = (toValue: number, mode: 'collapsed' | 'half' | 'expanded') => {
    setSheetMode(mode);
    Animated.spring(sheetHeightAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const handleToggleFullMap = () => {
    if (sheetMode === 'collapsed') {
      animateToHeight(HALF_HEIGHT, 'half');
    } else {
      animateToHeight(COLLAPSED_HEIGHT, 'collapsed');
    }
  };

  const handleToggleExpandDetails = () => {
    if (sheetMode === 'expanded') {
      animateToHeight(HALF_HEIGHT, 'half');
    } else {
      animateToHeight(EXPANDED_HEIGHT, 'expanded');
    }
  };

  // Live location watcher for map navigation
  useEffect(() => {
    let locationSub: any = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (currentLoc) {
          setMyLocation({
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude,
            heading: currentLoc.coords.heading || 0,
          });
        }
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          (newLoc) => {
            setMyLocation({
              latitude: newLoc.coords.latitude,
              longitude: newLoc.coords.longitude,
              heading: newLoc.coords.heading || 0,
            });
          }
        );
      } catch (err) {
        console.log("Location tracking watch error:", err);
      }
    })();
    return () => {
      if (locationSub && locationSub.remove) locationSub.remove();
    };
  }, []);

  const handleStartTrip = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
      const lat = loc?.coords?.latitude ?? myLocation?.latitude;
      const lng = loc?.coords?.longitude ?? myLocation?.longitude;

      const payload: any = {
        bookingId,
        eta: routeInfo?.duration || "15 mins",
      };

      if (lat !== undefined && lng !== undefined) {
        payload.latitude = lat;
        payload.longitude = lng;
      }

      socket.emit("servicer-started-trip", payload);
      await apiClient.post("/booking/start-trip", payload).catch(() => {});
      setTripStarted(true);
      if (bookingId) {
        await AsyncStorage.setItem(`@trip_started_${bookingId}`, "true");
      }
      Alert.alert("Trip Started", "Live location is now being shared with the customer.");
    } catch (err: any) {
      console.warn("Failed to start trip:", err);
    }
  };

  const handleArrived = async () => {
    try {
      const payload = { bookingId };
      socket.emit("servicer-arrived", payload);
      await apiClient.post("/booking/arrived", payload).catch(() => {});
      setHasArrived(true);
      if (bookingId) {
        await AsyncStorage.setItem(`@has_arrived_${bookingId}`, "true");
      }
      Alert.alert("Arrived", "Customer has been notified of your arrival. Please collect their 4-digit OTP.");
    } catch (err: any) {
      console.warn("Failed to mark arrival:", err);
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert("Enter valid OTP", "Please enter the complete 4-digit OTP.");
      return;
    }

    if (!bookingId) {
      Alert.alert("Error", "Booking ID not found. Please refresh the page.");
      return;
    }

    try {
      setIsVerifyingOtp(true);

      // 1. Make sure socket is connected and in booking room
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("join-tracking", { bookingId });

      // 2. Emit socket events (support all common event names)
      socket.emit("verify-start-otp", {
        bookingId,
        otp,
      });
      socket.emit("verify-otp", {
        bookingId,
        otp,
      });

      // 3. REST API verification
      apiClient.post("/booking/otp/start/verify", { bookingId, otp })
        .then(async (res) => {
          if (res && res.data && (res.data.success || res.status === 200)) {
            setIsVerifyingOtp(false);
            setOtpVerified(true);
            if (bookingId) {
              await setActiveBookingId(bookingId);
              hydrateFromApi(bookingId);
            }
          }
        })
        .catch(() => {
          // Ignore verification background note
        });

      // Auto-clear loading spinner after timeout if socket/API hasn't responded
      setTimeout(() => {
        setIsVerifyingOtp(false);
      }, 6000);
    } catch (err: any) {
      setIsVerifyingOtp(false);
      Alert.alert("Error", err?.message || "Failed to submit OTP");
    }
  };

  useEffect(() => {
    const onOtpSuccess = async (payload: any) => {
      // 🔒 Guard: only grant access if the success is for THIS booking
      const incomingId = payload?.bookingId ?? payload?._id ?? payload?.booking?._id;
      if (incomingId && incomingId !== bookingId) {
        return;
      }

      setIsVerifyingOtp(false);
      setOtpVerified(true); // 🔥 IMPORTANT (don't forget this)

      if (bookingId) {
        await setActiveBookingId(bookingId);
        await AsyncStorage.removeItem(`@trip_started_${bookingId}`).catch(() => {});
        await AsyncStorage.removeItem(`@has_arrived_${bookingId}`).catch(() => {});
        hydrateFromApi(bookingId);
      }
    };

    const onOtpFailed = (payload?: any) => {
      setIsVerifyingOtp(false);
      const msg = payload?.message || (typeof payload === 'string' ? payload : "Invalid OTP. Please check and try again.");
      Alert.alert("Invalid OTP", msg);
    };

    const onBookingCompleted = (payload: any) => {
      const incomingId = payload?.bookingId ?? payload?._id;
      if (incomingId && incomingId !== bookingId) return;
      resetBookingState();
      navigation.replace("BookingCompleted");
    };

    const onPaymentSuccess = (payload: any) => {
      const incomingId = payload?.bookingId ?? payload?._id;
      if (incomingId && incomingId !== bookingId) return;
      if (bookingId) {
        hydrateFromApi(bookingId);
      }
    };

    const onBookingConfirmed = (payload: any) => {
      const incomingBooking = payload?.booking || payload;
      const incomingId = incomingBooking?._id || incomingBooking?.bookingId;
      if (incomingId && bookingId && incomingId !== bookingId) return;
      if (incomingBooking) {
        setJob((prev: any) => ({ ...prev, ...incomingBooking }));
      }
      if (bookingId || incomingId) {
        hydrateFromApi(bookingId || incomingId);
      }
    };

    // Robust listeners across potential backend event names
    socket.on("booking-confirmed", onBookingConfirmed);
    socket.on("otp-success", onOtpSuccess);
    socket.on("start-otp-success", onOtpSuccess);
    socket.on("verify-start-otp-success", onOtpSuccess);
    socket.on("verify-otp-success", onOtpSuccess);
    socket.on("start-otp-verified", onOtpSuccess);
    socket.on("otp-verified", onOtpSuccess);
    socket.on("job-started", onOtpSuccess);

    socket.on("start-otp-failed", onOtpFailed);
    socket.on("otp-failed", onOtpFailed);
    socket.on("verify-start-otp-failed", onOtpFailed);
    socket.on("verify-otp-failed", onOtpFailed);

    socket.on("booking-completed", onBookingCompleted);
    socket.on("payment-success", onPaymentSuccess);

    return () => {
      socket.off("booking-confirmed", onBookingConfirmed);
      socket.off("otp-success", onOtpSuccess);
      socket.off("start-otp-success", onOtpSuccess);
      socket.off("verify-start-otp-success", onOtpSuccess);
      socket.off("verify-otp-success", onOtpSuccess);
      socket.off("start-otp-verified", onOtpSuccess);
      socket.off("otp-verified", onOtpSuccess);
      socket.off("job-started", onOtpSuccess);

      socket.off("start-otp-failed", onOtpFailed);
      socket.off("otp-failed", onOtpFailed);
      socket.off("verify-start-otp-failed", onOtpFailed);
      socket.off("verify-otp-failed", onOtpFailed);

      socket.off("booking-completed", onBookingCompleted);
      socket.off("payment-success", onPaymentSuccess);
    };
  }, [bookingId]);
  useEffect(() => {
    const onReadyForPickup = (payload: any) => {
      // 🔒 HARD GUARD
      if (partsCollected) {
        return;
      }

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
            onPress={() => (navigation.getParent() as any)?.navigate("Home") || navigation.navigate("Home" as any)}
          >
            <Text style={styles.refreshButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // 🗺️ 1. PRE-OTP TRACKING & NAVIGATION VIEW (FULL-SCREEN MAPBOX WITH OVERLAYS)
  // =========================================================================
  if (!otpVerified && isLeader) {
    return (
      <View style={styles.trackingFullScreenContainer}>
        {/* MAP SECTION - Full-Bleed Mapbox Streets Vector Map with Live Marker & Route */}
        <View style={styles.trackingMapArea}>
          <EmbeddedTrackingMap
            location={myLocation}
            destination={
              userLiveLocation
                ? (parseCoordinates(userLiveLocation) || undefined)
                : (parseCoordinates(job) || (job?.address ? parseCoordinates(job.address) : undefined) || undefined)
            }
            isFullScreen={true}
            onRouteUpdated={setRouteInfo}
          />
        </View>

        {/* TOP FLOATING HEADER (Back Button + Navigation Instruction Pill + Report Issue) */}
        <View style={styles.topFloatingHeader} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingRoundBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>

          {/* Turn-by-Turn Navigation HUD Card */}
          <TouchableOpacity
            style={styles.floatingRoutePill}
            activeOpacity={0.88}
            onPress={() => {
              if (routeInfo?.steps && routeInfo.steps.length > 0) {
                setShowTurnsModal(true);
              }
            }}
          >
            <View style={[
              styles.routePillIconCircle,
              routeInfo?.modifier?.includes('left') ? { backgroundColor: '#2563EB' } :
              routeInfo?.modifier?.includes('right') ? { backgroundColor: '#D97706' } :
              { backgroundColor: '#0D9488' }
            ]}>
              <Ionicons
                name={getTurnIconName(routeInfo?.modifier, routeInfo?.currentStep?.type)}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={styles.floatingRouteDistanceText}>
                    {routeInfo?.distanceToTurn || (routeInfo ? `In ${routeInfo.distance}` : "Calculating...")}
                  </Text>
                  <Text style={styles.floatingRouteKeywordText} numberOfLines={1}>
                    {routeInfo?.keyword || "Go Straight"}
                  </Text>
                </View>
                {routeInfo?.duration ? (
                  <View style={styles.etaChip}>
                    <Text style={styles.etaChipText}>{routeInfo.duration}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={styles.floatingRouteSub} numberOfLines={1}>
                  {routeInfo?.streetName ? `onto ${routeInfo.streetName}` : (routeInfo?.instruction || "Follow route to customer")}
                </Text>
                {routeInfo?.steps && routeInfo.steps.length > 0 ? (
                  <Text style={styles.turnsBadgeText}>
                    {routeInfo.steps.length} turns ›
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

          {/* Symmetrical Report Issue circular button */}
          <TouchableOpacity
            style={styles.floatingRoundBtn}
            onPress={() => (navigation as any).navigate("ProfileTab", { 
              screen: "RaiseIssue", 
              params: { 
                bookingId, 
                bookingNumber: job?.bookingCode || (bookingId ? formatBookingId(bookingId) : undefined) 
              } 
            })}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* FLOATING ACTION BUTTON ON MAP (Only visible when sheet is expanded/half to quickly snap back to map) */}
        {sheetMode !== 'collapsed' && (
          <View style={styles.floatingMapToggleContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.floatingMapToggleBtn}
              onPress={handleToggleFullMap}
              activeOpacity={0.85}
            >
              <Ionicons
                name="map"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.floatingMapToggleBtnText}>
                Full Map
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BOTTOM SHEET CARD (Collapsible, Draggable & Scrollable Booking Details) */}
        <Animated.View style={[styles.bottomSheetContainer, { height: sheetHeightAnim }]}>
          {/* Interactive Drag Handle Area */}
          <TouchableOpacity
            style={styles.dragHandleContainer}
            activeOpacity={0.85}
            onPress={() => {
              if (sheetMode === 'collapsed') animateToHeight(HALF_HEIGHT, 'half');
              else if (sheetMode === 'half') animateToHeight(EXPANDED_HEIGHT, 'expanded');
              else animateToHeight(COLLAPSED_HEIGHT, 'collapsed');
            }}
          >
            <View style={styles.dragHandle} />
          </TouchableOpacity>

          {/* Sheet Header Row with Mode Switch Button */}
          <View style={styles.sheetTopHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Text style={styles.sheetHeaderTitle}>Booking Details</Text>
              {bookingId ? (
                <View style={styles.sheetBookingPill}>
                  <Text style={styles.sheetBookingPillText}>{job?.bookingCode || (bookingId ? formatBookingId(bookingId) : '')}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.sheetHeaderToggleBtn}
              onPress={() => {
                if (sheetMode === 'collapsed') {
                  animateToHeight(HALF_HEIGHT, 'half');
                } else if (sheetMode === 'half') {
                  animateToHeight(EXPANDED_HEIGHT, 'expanded');
                } else {
                  animateToHeight(COLLAPSED_HEIGHT, 'collapsed');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={sheetMode === 'collapsed' ? "chevron-up" : (sheetMode === 'expanded' ? "chevron-down" : "expand")}
                size={15}
                color="#0D9488"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.sheetHeaderToggleBtnText}>
                {sheetMode === 'collapsed' ? 'View Details' : (sheetMode === 'expanded' ? 'Full Map' : 'Expand')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode 1: Collapsed Peek View (Shows compact info & instant action button) */}
          {sheetMode === 'collapsed' ? (
            <View style={styles.collapsedPeekContent}>
              <View style={styles.collapsedCustomerRow}>
                <View style={styles.collapsedAvatar}>
                  <Ionicons name="person" size={20} color="#0D9488" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.collapsedCustomerName} numberOfLines={1}>
                    {job?.user?.fullname || job?.user?.name || job?.userName || job?.name || "Customer"}
                  </Text>
                  {routeInfo ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={styles.collapsedLiveDistanceText} numberOfLines={1}>
                        📍 {routeInfo.distance} • ⏱️ {routeInfo.duration}
                      </Text>
                      {getEstimatedArrival(routeInfo.duration) ? (
                        <Text style={styles.collapsedLiveEtaText} numberOfLines={1}>
                          (~{getEstimatedArrival(routeInfo.duration)})
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.collapsedServiceName} numberOfLines={1}>
                      {job?.serviceCategoryName || job?.service || job?.serviceName || "Service"} • ₹{totalCost}
                    </Text>
                  )}
                </View>

                {/* Direct Action Button in peek mode */}
                {!tripStarted ? (
                  <TouchableOpacity style={styles.collapsedActionBtn} onPress={handleStartTrip} activeOpacity={0.85}>
                    <Ionicons name="play" size={15} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.collapsedActionBtnText}>Start Trip</Text>
                  </TouchableOpacity>
                ) : !hasArrived ? (
                  <TouchableOpacity style={[styles.collapsedActionBtn, { backgroundColor: '#EA580C' }]} onPress={handleArrived} activeOpacity={0.85}>
                    <Ionicons name="location" size={15} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.collapsedActionBtnText}>Arrived</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.collapsedActionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={() => animateToHeight(EXPANDED_HEIGHT, 'expanded')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="key" size={15} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.collapsedActionBtnText}>Enter OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Mode 2 & 3: Half & Expanded Scrollable View */
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.bottomSheetScrollContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {/* Booking Details Card */}
                <UserDetailContainer
                  name={
                    job?.user?.fullname ||
                    job?.user?.name ||
                    job?.userName ||
                    job?.name ||
                    job?.userId?.fullname ||
                    job?.userId?.name ||
                    job?.customerName ||
                    "Customer"
                  }
                  serviceCategoryName={
                    job?.serviceCategoryName ||
                    job?.service ||
                    job?.serviceName ||
                    job?.categoryName ||
                    job?.category ||
                    "-"
                  }
                  cost={`₹ ${totalCost}`}
                  advancePaid={advancePaid > 0 ? `₹ ${advancePaid}` : undefined}
                  remainingAmount={advancePaid > 0 ? `₹ ${remainingAmount}` : undefined}
                  address={
                    typeof job?.address === "string"
                      ? job.address
                      : (job?.address?.address ||
                         [job?.address?.street, job?.address?.area, job?.address?.city, job?.address?.region].filter(Boolean).join(", ") ||
                         "-")
                  }
                  employeeCount={String(job?.employeeCount || "1")}
                  durationInMinutes={
                    job?.durationInMinutes
                      ? `${job.durationInMinutes} mins`
                      : (job?.duration || job?.workingHours || "Not Provided")
                  }
                  serviceTime={
                    job?.scheduleDateTime
                      ? new Date(job.scheduleDateTime).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : job?.createdAt
                      ? new Date(job.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : undefined
                  }
                  bookingNumber={job?.bookingCode || (bookingId ? formatBookingId(bookingId) : undefined)}
                  bookingStatus={job?.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
                  coordinates={job?.resolvedCoords || job?.coordinates || job?.location || job?.userLocation}
                  onCallPress={isLeader ? confirmCall : undefined}
                  isCalling={calling}
                />

                {/* Assigned Helpers if any */}
                {job?.teamHelpers?.length > 0 && (
                  <View style={[styles.teamContainer, { marginTop: 10 }]}>
                    <Text style={styles.teamTitle}>Assigned Helpers</Text>
                    {job.teamHelpers.map((helper: any, idx: number) => (
                      <View key={idx} style={styles.memberItem}>
                        <Ionicons name="people" size={18} color="#666" />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{helper.fullname || helper.storeName || "Helper"}</Text>
                          <Text style={styles.memberRole}>Helper</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* SEQUENTIAL STEP-BY-STEP ACTIONS (Step 1: Start Trip -> Step 2: I Have Arrived -> Step 3: Enter OTP) */}
                <View style={styles.stepActionWrapper}>
                  {/* STEP 1: START TRIP */}
                  {!tripStarted && (
                    <TouchableOpacity
                      style={styles.modernTripStartBtn}
                      onPress={handleStartTrip}
                      activeOpacity={0.85}
                    >
                      <View style={styles.modernPlayCircle}>
                        <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ marginLeft: 14 }}>
                        <Text style={styles.modernTripStartTitle}>Start Trip</Text>
                        <Text style={styles.modernTripStartSubtitle}>I'm on my way to the customer</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* STEP 2: ARRIVAL CONFIRMATION */}
                  {tripStarted && !hasArrived && (
                    <TouchableOpacity
                      style={styles.arrivedActionBtn}
                      onPress={handleArrived}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="location-sharp" size={24} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.tripActionBtnText}>
                        I Have Arrived at Location
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* STEP 3: OTP VERIFICATION */}
                  {hasArrived && (
                    <View style={styles.otpStepContainer}>
                      <View style={styles.arrivedSuccessBanner}>
                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                        <Text style={styles.arrivedSuccessText}>
                          Arrived at Customer Location!
                        </Text>
                      </View>
                      <Text style={styles.subTitle}>
                        Collect OTP from customer to start service
                      </Text>
                      <Text style={[styles.label, { marginBottom: 6, marginTop: 6 }]}>Enter 4-digit OTP:</Text>

                      <OtpInput
                        onOtpChange={(code) => setOtp(code)}
                        onOtpComplete={(code) => setOtp(code)}
                        resendEnabled={false}
                      />

                      <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
                        <BottomButton
                          onPress={handleVerifyOtp}
                          title="Verify & Start Work"
                          loading={isVerifyingOtp}
                          disabled={isVerifyingOtp || otp.length !== 4}
                          widthCount={0.88}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Pickup Details if any */}
                {pickupDetails && !partsCollected && (
                  <View style={[styles.shopContainer, { marginTop: 12 }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Parts Ready for Pickup 🏪</Text>
                    <Text style={styles.shopName}>Shop: {pickupDetails.shop?.name}</Text>
                    <Text style={styles.shopAddress}>Address: {pickupDetails.shop?.address}</Text>

                    <View style={{ marginVertical: 8, backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 4 }}>Items:</Text>
                      {Array.isArray(pickupDetails.parts) && pickupDetails.parts.map((p: any, i: number) => (
                        <Text key={i} style={{ fontSize: 14 }}>• {p.partName || p.partsname} x {p.quantity}</Text>
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
            </KeyboardAvoidingView>
          )}
        </Animated.View>

        {/* Turn-by-Turn Maneuvers List Modal */}
        <Modal
          visible={showTurnsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTurnsModal(false)}
        >
          <View style={styles.turnsModalOverlay}>
            <View style={styles.turnsModalContainer}>
              <View style={styles.turnsModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.turnsModalTitle}>Driving Directions</Text>
                  <Text style={styles.turnsModalSubtitle}>
                    {routeInfo?.duration} ({routeInfo?.distance}) • {routeInfo?.steps?.length || 0} turns
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTurnsModal(false)}
                  style={styles.turnsModalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.turnsModalList} showsVerticalScrollIndicator={false}>
                {routeInfo?.steps?.map((step: any, idx: number) => (
                  <View key={idx} style={styles.turnModalItem}>
                    <View style={[
                      styles.turnModalItemIcon,
                      step.modifier?.includes('left') ? { backgroundColor: '#DBEAFE' } :
                      step.modifier?.includes('right') ? { backgroundColor: '#FEF3C7' } :
                      { backgroundColor: '#CCFBF1' }
                    ]}>
                      <Ionicons
                        name={getTurnIconName(step.modifier, step.type)}
                        size={18}
                        color={
                          step.modifier?.includes('left') ? '#2563EB' :
                          step.modifier?.includes('right') ? '#D97706' :
                          '#0D9488'
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.turnModalItemTop}>
                        <Text style={{ color: '#0F172A', fontWeight: '800' }}>{step.distanceText}</Text>
                        {' • '}
                        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{step.keyword}</Text>
                      </Text>
                      <Text style={styles.turnModalItemSub} numberOfLines={2}>
                        {step.streetName ? `onto ${step.streetName}` : step.instruction}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // =========================================================================
  // 🛠️ 2. POST-OTP SERVICE & COMPLETION VIEW
  // =========================================================================
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
            {/* ✅ Assigned Team Section */}
            {(job?.teamLeader || job?.teamHelpers?.length > 0) && (
              <View style={styles.teamContainer}>
                <Text style={styles.teamTitle}>Assigned Team</Text>
                
                {/* Leader */}
                {job?.teamLeader && (
                  <View style={styles.memberItem}>
                    <Ionicons name="person" size={18} color={theme.colors.primary} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{job.teamLeader.fullname || job.teamLeader.storeName || "Leader"}</Text>
                      <Text style={styles.memberRole}>Leader</Text>
                    </View>
                  </View>
                )}

                {/* Helpers */}
                {job?.teamHelpers?.map((helper: any, idx: number) => (
                  <View key={idx} style={styles.memberItem}>
                    <Ionicons name="people" size={18} color="#666" />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{helper.fullname || helper.storeName || "Helper"}</Text>
                      <Text style={styles.memberRole}>Helper</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ✅ Job Details Section */}
            <UserDetailContainer
              name={
                job?.user?.fullname ||
                job?.user?.name ||
                job?.userName ||
                job?.name ||
                job?.userId?.fullname ||
                job?.userId?.name ||
                job?.customerName ||
                "Customer"
              }
              serviceCategoryName={
                job?.serviceCategoryName ||
                job?.service ||
                job?.serviceName ||
                job?.categoryName ||
                job?.category ||
                "-"
              }
              cost={`₹ ${totalCost}`}
              advancePaid={advancePaid > 0 ? `₹ ${advancePaid}` : undefined}
              remainingAmount={advancePaid > 0 ? `₹ ${remainingAmount}` : undefined}
              address={
                typeof job?.address === "string"
                  ? job.address
                  : (job?.address?.address ||
                     [job?.address?.street, job?.address?.area, job?.address?.city, job?.address?.region].filter(Boolean).join(", ") ||
                     "-")
              }
              employeeCount={String(job?.employeeCount || "1")}
              durationInMinutes={
                job?.durationInMinutes
                  ? `${job.durationInMinutes} mins`
                  : (job?.duration || job?.workingHours || "Not Provided")
              }
              serviceTime={
                job?.scheduleDateTime
                  ? new Date(job.scheduleDateTime).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : job?.createdAt
                  ? new Date(job.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : undefined
              }
              bookingNumber={job?.bookingCode || (bookingId ? formatBookingId(bookingId) : undefined)}
              bookingStatus={job?.status === 'in_progress' ? 'In Progress' : 'Confirmed'}
              onCallPress={isLeader ? confirmCall : undefined}
              isCalling={calling}
            />

            {/* ⏱️ MODERN DARK-EMERALD CIRCULAR SERVICE TIMER CARD (Placed After Details) */}
            {(timerData?.isTimeBased || job?.durationInMinutes || job?.workingHours) && (otpVerified || job?.status === 'in_progress') && (() => {
              // 1. Dedicated Loading State while timer status is being initialized/fetched
              if (isTimerLoading && !timerData) {
                return (
                  <View style={styles.modernTimerCard}>
                    <View style={styles.timerCardHeader}>
                      <View style={styles.serviceProgressBadge}>
                        <ActivityIndicator size="small" color="#2DD4BF" style={{ marginRight: 6 }} />
                        <Text style={styles.serviceProgressText}>STARTING SERVICE TIMER...</Text>
                      </View>
                      <View style={styles.liveSyncBadge}>
                        <Ionicons name="radio" size={12} color="#2DD4BF" style={{ marginRight: 4 }} />
                        <Text style={styles.liveSyncText}>SYNCING</Text>
                      </View>
                    </View>

                    <View style={styles.timerCircleOuterContainer}>
                      <View style={[styles.timerCircleInnerGlow, { width: 170, height: 170, borderRadius: 85 }]}>
                        <ActivityIndicator size="large" color="#2DD4BF" />
                        <Text style={[styles.timerDigitText, { fontSize: 16, marginTop: 12, fontWeight: '700' }]}>
                          Syncing Timer...
                        </Text>
                        <Text style={styles.timerPercentCompleted}>
                          ESTABLISHING LIVE TRACKING
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timerFooterNote}>
                      <Ionicons name="hourglass-outline" size={14} color="#6EE7B7" style={{ marginRight: 6 }} />
                      <Text style={styles.timerFooterNoteText}>
                        Retrieving booked hours and real-time countdown...
                      </Text>
                    </View>
                  </View>
                );
              }

              const bookedDurationMinutes = timerData?.totalDurationMinutes || (job?.durationInMinutes ? Number(job.durationInMinutes) : (job?.workingHours ? parseInt(String(job.workingHours)) : 60));
              const totalDurationSecs = Math.max(1, bookedDurationMinutes * 60);
              
              let currentRemainingSecs = timerData?.remainingSeconds ?? totalDurationSecs;
              let elapsedSecs = Math.max(0, totalDurationSecs - currentRemainingSecs);

              let percentCompleted = 0;
              let progressThemeColor = '#2DD4BF';
              let trackColor = 'rgba(20, 184, 166, 0.18)';
              let statusLabel = 'SERVICE IN PROGRESS';
              let progressSubtitle = 'COMPLETED';

              if (timerData?.timerStatus === 'EXTRA_TIME_RUNNING') {
                currentRemainingSecs = timerData.extraRemainingSeconds ?? 600;
                elapsedSecs = totalDurationSecs + Math.max(0, 600 - (timerData.extraRemainingSeconds ?? 600));
                const extraElapsed = Math.max(0, 600 - (timerData.extraRemainingSeconds ?? 600));
                percentCompleted = Math.min(100, Math.max(0, Math.round((extraElapsed / 600) * 100)));
                progressThemeColor = '#F59E0B';
                trackColor = 'rgba(245, 158, 11, 0.2)';
                statusLabel = 'EXTRA TIME RUNNING';
                progressSubtitle = 'BUFFER USED';
              } else if (timerData?.timerStatus === 'OVERTIME_RUNNING') {
                currentRemainingSecs = timerData.overtimeSeconds ?? 0;
                elapsedSecs = totalDurationSecs + 600 + (timerData.overtimeSeconds ?? 0);
                percentCompleted = 100;
                progressThemeColor = '#EF4444';
                trackColor = 'rgba(239, 68, 68, 0.25)';
                statusLabel = 'OVERTIME ACTIVE';
                progressSubtitle = 'OVERTIME ELAPSED';
              } else {
                percentCompleted = totalDurationSecs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedSecs / totalDurationSecs) * 100))) : 0;
                progressThemeColor = '#2DD4BF';
                trackColor = 'rgba(20, 184, 166, 0.18)';
                statusLabel = 'SERVICE IN PROGRESS';
                progressSubtitle = 'COMPLETED';
              }
              
              const displayTimerMins = Math.floor(currentRemainingSecs / 60);
              const displayTimerSecs = currentRemainingSecs % 60;

              const elapsedMins = Math.floor(elapsedSecs / 60);
              const elapsedSecsRem = elapsedSecs % 60;

              // SVG Circle dimensions
              const size = 186;
              const strokeWidth = 9;
              const radius = (size - strokeWidth) / 2;
              const center = size / 2;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (circumference * percentCompleted) / 100;

              // Cap Dot coordinates
              const angleInDeg = (percentCompleted / 100) * 360 - 90;
              const angleInRad = (angleInDeg * Math.PI) / 180;
              const dotX = center + radius * Math.cos(angleInRad);
              const dotY = center + radius * Math.sin(angleInRad);

              return (
                <View style={styles.modernTimerCard}>
                  {/* Header Row: Status Badge + Live Sync Badge */}
                  <View style={styles.timerCardHeader}>
                    <View style={[
                      styles.serviceProgressBadge,
                      timerData?.timerStatus === 'EXTRA_TIME_RUNNING' && { borderColor: '#D97706', backgroundColor: '#78350F' },
                      timerData?.timerStatus === 'OVERTIME_RUNNING' && { borderColor: '#DC2626', backgroundColor: '#7F1D1D' },
                    ]}>
                      <View style={[
                        styles.liveGreenDot,
                        timerData?.timerStatus === 'EXTRA_TIME_RUNNING' && { backgroundColor: '#F59E0B' },
                        timerData?.timerStatus === 'OVERTIME_RUNNING' && { backgroundColor: '#EF4444' },
                      ]} />
                      <Text style={[
                        styles.serviceProgressText,
                        timerData?.timerStatus === 'EXTRA_TIME_RUNNING' && { color: '#FDE68A' },
                        timerData?.timerStatus === 'OVERTIME_RUNNING' && { color: '#FECACA' },
                      ]}>
                        {statusLabel}
                      </Text>
                    </View>

                    <View style={styles.liveSyncBadge}>
                      <Ionicons name="radio" size={12} color={progressThemeColor} style={{ marginRight: 4 }} />
                      <Text style={[styles.liveSyncText, { color: progressThemeColor }]}>LIVE SYNC</Text>
                    </View>
                  </View>

                  {/* Center Circular Countdown Timer with SVG progress loading ring */}
                  <View style={styles.timerCircleOuterContainer}>
                    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
                        {/* Background Circular Track */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={trackColor}
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        {/* Dynamic Progress Loading Ring */}
                        <Circle
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={progressThemeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          origin={`${center}, ${center}`}
                          rotation={-90}
                        />
                        {/* Cap Dot at head of progress arc */}
                        {percentCompleted > 0 && (
                          <Circle
                            cx={dotX}
                            cy={dotY}
                            r={strokeWidth / 2}
                            fill={progressThemeColor}
                          />
                        )}
                      </Svg>

                      <View style={[
                        styles.timerCircleInnerGlow,
                        timerData?.timerStatus === 'EXTRA_TIME_RUNNING' && { backgroundColor: 'rgba(120, 53, 15, 0.35)' },
                        timerData?.timerStatus === 'OVERTIME_RUNNING' && { backgroundColor: 'rgba(127, 29, 29, 0.35)' },
                      ]}>
                        <View style={[
                          styles.timerClockIconCircle,
                          { backgroundColor: `${progressThemeColor}33` }
                        ]}>
                          <Ionicons name="time" size={16} color={progressThemeColor} />
                        </View>
                        <View style={styles.timerDigitsRow}>
                          {timerData?.timerStatus === 'OVERTIME_RUNNING' && (
                            <Text style={[styles.timerDigitPlus, { color: progressThemeColor }]}>+</Text>
                          )}
                          <Text style={styles.timerDigitText}>
                            {displayTimerMins.toString().padStart(2, '0')}
                          </Text>
                          <Text style={styles.timerDigitColon}>:</Text>
                          <Text style={styles.timerDigitText}>
                            {displayTimerSecs.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={[styles.timerPercentCompleted, { color: progressThemeColor }]}>
                          {percentCompleted}% {progressSubtitle}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 3-Column Info Stats Panel */}
                  <View style={styles.timerStatsPanel}>
                    <View style={styles.timerStatCol}>
                      <Text style={styles.timerStatLabel}>Booked Time</Text>
                      <Text style={styles.timerStatValue}>{bookedDurationMinutes} mins</Text>
                    </View>
                    <View style={styles.timerStatDivider} />
                    <View style={styles.timerStatCol}>
                      <Text style={styles.timerStatLabel}>Time Elapsed</Text>
                      <Text style={styles.timerStatValue}>{elapsedMins}m {elapsedSecsRem}s</Text>
                    </View>
                    <View style={styles.timerStatDivider} />
                    <View style={styles.timerStatCol}>
                      <Text style={styles.timerStatLabel}>Service</Text>
                      <Text style={styles.timerStatValue} numberOfLines={1}>
                        {job?.serviceCategoryName || job?.serviceName || job?.categoryName || "Service"}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Shield / Note */}
                  <View style={styles.timerFooterNote}>
                    <Ionicons
                      name={timerData?.timerStatus === 'EXTRA_TIME_RUNNING' || timerData?.timerStatus === 'OVERTIME_RUNNING' ? "alert-circle" : "shield-checkmark"}
                      size={14}
                      color={timerData?.timerStatus === 'EXTRA_TIME_RUNNING' || timerData?.timerStatus === 'OVERTIME_RUNNING' ? "#FBBF24" : "#6EE7B7"}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.timerFooterNoteText, (timerData?.timerStatus === 'EXTRA_TIME_RUNNING' || timerData?.timerStatus === 'OVERTIME_RUNNING') && { color: '#FDE68A' }]}>
                      {timerData?.timerStatus === 'RUNNING' && "Technician is actively performing your service."}
                      {timerData?.timerStatus === 'EXTRA_TIME_RUNNING' && "Planned time completed. 10m extra buffer active."}
                      {timerData?.timerStatus === 'OVERTIME_RUNNING' && "10m buffer expired. Job remains open."}
                      {(!timerData?.timerStatus || timerData?.timerStatus === 'IDLE') && "Technician is actively performing your service."}
                    </Text>
                  </View>

                  {/* Propose Extra Service Button if extra time or overtime is active */}
                  {(timerData?.timerStatus === 'EXTRA_TIME_RUNNING' || timerData?.timerStatus === 'OVERTIME_RUNNING') && (
                    <TouchableOpacity
                      style={[
                        styles.proposeExtraServiceBtn,
                        waitingServiceApproval && { opacity: 0.7, backgroundColor: '#0F766E' }
                      ]}
                      onPress={() =>
                        !waitingServiceApproval &&
                        navigation.navigate("AddService" as any, {
                          bookingId,
                          domainServiceId: job?.domainServiceId,
                        })
                      }
                      disabled={waitingServiceApproval}
                      activeOpacity={0.85}
                    >
                      {waitingServiceApproval ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.proposeExtraServiceText}>
                            Waiting for Customer Approval...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.proposeExtraServiceText}>
                            + Propose Extra Service (Add Hours)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* ✅ Extra Services List (Show if any are approved) */}
            {job?.extraServices?.some((s: any) => s.status === "APPROVED") && (
              <View style={styles.extraServicesContainer}>
                <Text style={styles.extraServicesTitle}>Extra Services Added:</Text>
                {job.extraServices
                  .filter((s: any) => s.status === "APPROVED")
                  .map((service: any, idx: number) => (
                    <View key={idx} style={styles.extraServiceItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={styles.extraServiceName}>• {service.serviceName}</Text>
                        <Text style={styles.extraServicePrice}>₹{service.price}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* ✅ After OTP Verified (Actions - Leader Only) */}
            {otpVerified && (
              <View style={{ marginVertical: 16 }}>
                {isLeader ? (
                  <>
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

                      {isFullPayment ? (
                        <TouchableOpacity
                          style={[styles.paymentButton, styles.cashButton, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4', paddingVertical: 16 }]}
                          onPress={handleDirectComplete}
                          disabled={isSubmitting}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.paymentIconCircle, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="checkmark-done-circle" size={24} color="#15803d" />
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.paymentButtonText, { color: '#15803d', fontSize: 16, fontWeight: '700' }]}>
                              {isSubmitting ? "Completing Booking..." : "Complete Booking (Paid in Full)"}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                              Amount paid: ₹{totalCost} • Tap to finish job
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward-circle" size={24} color="#15803d" />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.paymentButton, styles.cashButton]}
                            onPress={handleCashPayment}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                          >
                            <View style={styles.paymentIconCircle}>
                              <Ionicons name="cash-outline" size={22} color="#166534" />
                            </View>
                            <Text style={[styles.paymentButtonText, { color: '#166534' }]}>
                              {advancePaid > 0 ? `Pay Remaining (Cash): ₹${remainingAmount}` : `Pay Cash & Complete: ₹${totalCost}`}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#166534" style={{ marginLeft: 'auto' }} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.paymentButton, styles.onlineButton]}
                            onPress={handleRazorpayPayment}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                          >
                            <View style={styles.paymentIconCircle}>
                              <Ionicons name="card-outline" size={22} color="#1e40af" />
                            </View>
                            <Text style={[styles.paymentButtonText, { color: '#1e40af' }]}>
                              {advancePaid > 0 ? `Pay Remaining Online: ₹${remainingAmount}` : `Pay Online & Complete: ₹${totalCost}`}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#1e40af" style={{ marginLeft: 'auto' }} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd' }}>
                    <Text style={{ color: '#0369a1', fontWeight: '600', textAlign: 'center' }}>
                      Work is in progress. Please assist the team leader.
                    </Text>
                  </View>
                )}
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
  container: { flex: 1, padding: 14, backgroundColor: '#F8FAFC' },
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  extraServicesContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  extraServicesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  extraServiceItem: {
    marginBottom: 4,
  },
  extraServiceName: {
    fontSize: 14,
    color: '#475569',
  },
  extraServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
  },
  otpContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  modernTripStartBtn: {
    backgroundColor: '#059669', // Emerald/Teal matching reference
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernTripStartTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  modernTripStartSubtitle: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  tripStartBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  arrivedActionBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  tripActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
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
  teamContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2e4a',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
  },
  // Full-screen Mapbox Tracking & Bottom Sheet Layout
  trackingFullScreenContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topFloatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 52,
    left: 14,
    right: 14,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  floatingRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  floatingRoutePill: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  floatingRouteTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: -0.2,
  },
  routePillIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  etaChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexShrink: 0,
  },
  etaChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  collapsedLiveDistanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  collapsedLiveEtaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  floatingRouteSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  floatingRouteDistanceText: {
    color: '#0D9488',
    fontWeight: '800',
    fontSize: 13,
  },
  floatingRouteKeywordText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  turnsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 4,
  },
  turnsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  turnsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  turnsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  turnsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  turnsModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  turnsModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnsModalList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  turnModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  turnModalItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnModalItemTop: {
    fontSize: 14,
  },
  turnModalItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  floatingReportBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  floatingReportText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 1,
  },
  trackingMapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  floatingMapToggleContainer: {
    position: 'absolute',
    right: 16,
    bottom: 175,
    zIndex: 80,
  },
  floatingMapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  floatingMapToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: -5 },
    shadowRadius: 14,
    elevation: 16,
    overflow: 'hidden',
    zIndex: 90,
  },
  sheetTopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  sheetHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sheetBookingPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sheetBookingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  sheetHeaderToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  sheetHeaderToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  collapsedPeekContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  collapsedCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  collapsedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  collapsedCustomerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  collapsedServiceName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  collapsedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#0D9488',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  collapsedActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  stepActionWrapper: {
    marginTop: 14,
    marginBottom: 8,
  },
  otpStepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  arrivedSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  arrivedSuccessText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 14,
  },
  // ⏱️ Modern Dark-Emerald Circular Timer Card Styles
  modernTimerCard: {
    backgroundColor: '#042F2E', // Deep dark emerald green matching user app reference
    borderRadius: 24,
    padding: 20,
    marginVertical: 14,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  timerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#059669',
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  serviceProgressText: {
    color: '#6EE7B7',
    fontWeight: '800',
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 78, 74, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  liveSyncText: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timerCircleOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  timerCircleOuterRing: {
    width: 185,
    height: 185,
    borderRadius: 92.5,
    borderWidth: 9,
    borderColor: 'rgba(20, 184, 166, 0.18)',
    borderTopColor: '#2DD4BF',
    borderRightColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerCircleCapDot: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2DD4BF',
  },
  timerCircleInnerGlow: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: 'rgba(6, 78, 59, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerClockIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timerDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigitText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerDigitColon: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 5,
    marginTop: -3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timerDigitPlus: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2DD4BF',
    marginRight: 2,
  },
  timerPercentCompleted: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  timerStatsPanel: {
    backgroundColor: 'rgba(2, 44, 34, 0.85)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
  timerStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  timerStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 3,
  },
  timerStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  timerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(20, 184, 166, 0.25)',
  },
  timerFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  timerFooterNoteText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  proposeExtraServiceBtn: {
    marginTop: 14,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  proposeExtraServiceText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});