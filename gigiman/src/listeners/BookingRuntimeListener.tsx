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
  } = useProviderBooking();


  
  useEffect(() => {
const onOtpSuccess = ({ booking }: any) => {
  if (booking._id !== activeBookingId) return;
  setOtpVerified(true);
};
    const onBookingCancelled = (payload: any) => {
      console.log("📥 user-cancel-booking received:", payload);
      resetBookingState?.();
      Alert.alert("Booking Cancelled", "Customer cancelled the job");
      navigation.replace("Dashboard");
    };

    const onToolshopAccepted = (payload: any) => {
      setPickupDetails(payload);
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




  return null;
}