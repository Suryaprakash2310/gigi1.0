import { useContext, useEffect } from "react";
import { socket } from "@/socket/socket";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import { AuthContext } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "@/navigation/EmployeeStack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
type TabNavProp = BottomTabNavigationProp<AppStackParamList, "BookingStack">;

export default function BookingSocketListener() {
    const {
        addBookingRequest,
        removeBookingRequest,
        workingMode,
    } = useProviderBooking();
      const navigation = useNavigation<TabNavProp>();
    

    const { userRole } = useContext(AuthContext);
    useEffect(() => {
        console.log("🧠 BookingSocketListener mounted");
    }, []);
    useEffect(() => {
        const handleNewBooking = (payload: any) => {
            if (!workingMode) return;
            console.log("🔥 EVENT RECEIVED");
            console.log("📥 New booking request:", payload);
            if (!payload || !payload.bookingId) return;
            addBookingRequest({
                id: payload.bookingId,
                name: payload.user?.name,
                work: payload.service,
                cost: payload.totalPrice,
                address: payload.address,
                employeeCount: payload.employeeCount,
                expiresAt: Date.now() + 50000,
            });
        };

        const handleJobAssigned = (payload: any) => {
            console.log("📦 Job assigned:", payload.bookingId);
            removeBookingRequest(payload.bookingId);
        };

        const handleTeamBooking = (payload: any) => {
            if (userRole !== UserRole.MULTI_EMPLOYEE) return;
            if (!workingMode) return;

            console.log("🔥 Team booking:", payload);

            addBookingRequest({
                id: payload.bookingId,
                name: payload.user?.name,
                work: payload.service,
                address: payload.address,
                employeeCount: payload.employeeCount,
                isTeam: true,
                teamMembers: payload.teamMembers,
                teamId: payload.teamId,
                cost: payload.totalPrice,
                expiresAt: Date.now() + 50000,
            });
        };

        socket.on("new-booking-request", handleNewBooking);
        socket.on("job-assigned", handleJobAssigned);
        socket.on("team-booking-request", handleTeamBooking);

        return () => {
            socket.off("new-booking-request", handleNewBooking);
            socket.off("job-assigned", handleJobAssigned);
            socket.off("team-booking-request", handleTeamBooking);
        };
    }, [workingMode, userRole]);

    useEffect(() => {

  const onLeaderOtpReady = ({ bookingId }: any) => {
    console.log("🟢 LEADER OTP READY:", bookingId);

    navigation.navigate("BookingStack", {
      screen: "Booking",
      params: { bookingId }
    });
  };

  socket.on("leader-otp-ready", onLeaderOtpReady);

  return () => {
    socket.off("leader-otp-ready", onLeaderOtpReady);
  };

}, []);





    return null;
}