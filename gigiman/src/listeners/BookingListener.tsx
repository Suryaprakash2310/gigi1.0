import { useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { socket } from "@/socket/socket";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import { AuthContext } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "@/navigation/EmployeeStack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { playBookingSound, stopBookingSound } from "@/utils/BookingSoundManager";

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

    // ✅ Keep refs in sync so socket handlers always read latest values
    //    without needing to re-subscribe on every workingMode/userRole change.
    const workingModeRef = useRef(workingMode);
    const userRoleRef = useRef(userRole);

    useEffect(() => { workingModeRef.current = workingMode; }, [workingMode]);
    useEffect(() => { userRoleRef.current = userRole; }, [userRole]);

    /* ======================================================
       BOOKING REQUEST LISTENERS
       Registered once — reads live values via refs.
    ====================================================== */
    useEffect(() => {
        const handleNewBooking = async (payload: any) => {
            if (!workingModeRef.current) return;   // ✅ always fresh
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

            await playBookingSound();
        };

        const handleJobAssigned = async (payload: any) => {
            if (!workingModeRef.current) return; // ✅ Guard added
            console.log("📦 Job assigned:", payload.bookingId);
            removeBookingRequest(payload.bookingId);
            await stopBookingSound();
        };

        const handleTeamBooking = async (payload: any) => {
            if (userRoleRef.current !== UserRole.MULTI_EMPLOYEE) return; // ✅ always fresh
            if (!workingModeRef.current) return;                         // ✅ always fresh

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

            await playBookingSound();
        };

        socket.on("new-booking-request", handleNewBooking);
        socket.on("job-assigned", handleJobAssigned);
        socket.on("team-booking-request", handleTeamBooking);

        return () => {
            socket.off("new-booking-request", handleNewBooking);
            socket.off("job-assigned", handleJobAssigned);
            socket.off("team-booking-request", handleTeamBooking);
        };
    }, []); // ✅ Empty deps — registered once, refs keep values current

    /* ======================================================
       LEADER OTP READY
    ====================================================== */
    useEffect(() => {
        const onLeaderOtpReady = async ({ bookingId }: any) => {
            console.log("🟢 LEADER OTP READY:", bookingId);
            await stopBookingSound();

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

    /* ======================================================
       APP STATE — Stop sound when app goes to background
    ====================================================== */
    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (nextState) => {
            if (nextState !== "active") {
                console.log("📱 App went to background — stopping booking sound");
                await stopBookingSound();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return null;
}