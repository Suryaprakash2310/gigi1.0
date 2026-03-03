import { useEffect } from "react";
import { socket } from "@/socket/socket";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { useNavigation } from "@react-navigation/native";

export default function ProviderBookingRuntimeListener() {
  const navigation = useNavigation<any>();

  const {
    activeBookingId,
    setOtpVerified,
    setPickupDetails,
    setWaitingApproval,
    setWaitingServiceApproval,
  } = useProviderBooking();


  
  useEffect(() => {
const onOtpSuccess = ({ booking }: any) => {
  if (booking._id !== activeBookingId) return;
  setOtpVerified(true);
};
    const onBookingCancelled = ({ bookingId }: any) => {
      navigation.replace("Dashboard");
    };

    const onToolshopAccepted = (payload: any) => {
      setPickupDetails(payload);
    };

    //socket.on("otp-success", onOtpSuccess);
    socket.on("booking-cancelled-by-user", onBookingCancelled);
    socket.on("toolshop-accepted", onToolshopAccepted);

    return () => {
      //socket.off("otp-success", onOtpSuccess);
      socket.off("booking-cancelled-by-user", onBookingCancelled);
      socket.off("toolshop-accepted", onToolshopAccepted);
    };
  }, []);




  return null;
}