import { useEffect } from "react";
import { socket } from "@/socket/socket";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";

export default function ProviderBookingRuntimeListener() {
  const navigation = useNavigation<any>();

  const {
    activeBookingId,
    setOtpVerified,
    setPickupDetails,
    setWaitingApproval,
    setWaitingServiceApproval,
    resetBookingState,
    setPartRequest
  } = useProviderBooking();



  useEffect(() => {
    const onOtpSuccess = ({ booking }: any) => {
      if (booking._id !== activeBookingId) return;
      setOtpVerified(true);
    };
    const onBookingCancelled = (payload: any) => {
      console.log("📥 user-cancel-booking received:", payload);

      // 🔒 Only act if this cancellation belongs to the provider's active booking
      if (payload?.bookingId && payload.bookingId !== activeBookingId) {
        console.log("⚠ Ignoring cancel for unrelated booking:", payload.bookingId);
        return;
      }

      resetBookingState?.();
      Alert.alert("Booking Cancelled", "Customer cancelled the job");
      navigation.replace("Dashboard");
    };

    const onToolshopAccepted = (payload: any) => {
      if (!payload) return;

      if (payload.bookingId && payload.bookingId !== activeBookingId) return;

      console.log("[SOCKET RECEIVE] 🏪 toolshop-accepted:", payload);

      setPickupDetails({
        requestId: payload.requestId,
        otp: payload.otp,
        shop: payload.shop,
        parts: payload.parts,
        totalCost: payload.totalCost,
      });

      setWaitingApproval(false);
    };

    //socket.on("otp-success", onOtpSuccess);
    socket.on("booking-cancelled-by-user", onBookingCancelled);
    socket.on("user-cancel-booking", onBookingCancelled);
    socket.on("toolshop-accepted", onToolshopAccepted);

    return () => {
      //socket.off("otp-success", onOtpSuccess);
      socket.off("booking-cancelled-by-user", onBookingCancelled);
      socket.off("user-cancel-booking", onBookingCancelled);
      socket.off("toolshop-accepted", onToolshopAccepted);
    };
  }, []);


  useEffect(() => {
    if (!socket) return;

    const onToolRequestCreated = (payload: any) => {
      if (payload.bookingId !== activeBookingId) return;

      console.log("🧰 Part request created:", payload);

      setPartRequest({
        requestId: payload.requestId,
        totalCost: payload.totalCost,
        status: "PENDING",
      });

      setWaitingApproval(true);
    };

    const onToolPermissionApproved = (payload: any) => {
      if (payload.bookingId !== activeBookingId) return;

      console.log("✅ Tool permission approved:", payload);

      setPartRequest((prev: any) =>
        prev ? { ...prev, status: "APPROVED_BY_USER" } : prev
      );

      setWaitingApproval(false);
    };

    socket.on("tool-permission-approved", onToolPermissionApproved);

    socket.on("tool-request-created", onToolRequestCreated);

    return () => {
      socket.off("tool-request-created", onToolRequestCreated);
      socket.off("tool-permission-approved", onToolPermissionApproved);
    };
  }, [socket, activeBookingId]);


  // useEffect(() => {
  //   if (!socket) return;

  //   const onServiceApproved = (payload: any) => {
  //     if (payload.bookingId !== activeBookingId) return;

  //     console.log("✅ Service approved:", payload);

  //     setWaitingServiceApproval(false);
  //   };

  //   const onServiceRejected = (payload: any) => {
  //     if (payload.bookingId !== activeBookingId) return;

  //     console.log("❌ Service rejected:", payload);

  //     setWaitingServiceApproval(false);

  //     Alert.alert("Customer Rejected", "Continue with original service.");
  //   };

  //   socket.on("service-approved", onServiceApproved);
  //   socket.on("service-rejected", onServiceRejected);

  //   return () => {
  //     socket.off("service-approved", onServiceApproved);
  //     socket.off("service-rejected", onServiceRejected);
  //   };
  // }, []);




  return null;
}