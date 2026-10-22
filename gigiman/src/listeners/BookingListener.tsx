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
import { parseCoordinates } from "@/utils/location";

type TabNavProp = BottomTabNavigationProp<AppStackParamList, "BookingStack">;

export default function BookingSocketListener() {
    const {
        addBookingRequest,
        removeBookingRequest,
        workingMode,
        setActiveBookingId,
    } = useProviderBooking();
    const navigation = useNavigation<TabNavProp>();
    const { userRole } = useContext(AuthContext);

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
            if (!payload || !payload.bookingId) return;

            const coords = parseCoordinates(payload);

            addBookingRequest({
                id: payload.bookingId,
                name: payload.user?.name,
                work: payload.service,
                serviceCategoryName: payload.service,
                cost: payload.totalPrice,
                address: payload.address,
                coordinates: coords ? [coords.longitude, coords.latitude] : (payload.coordinates || payload.location?.coordinates || payload.userLocation?.coordinates),
                employeeCount: payload.employeeCount,
                isScheduled: payload.isScheduled,
                scheduleDateTime: payload.scheduleDateTime,
                createdAt: payload.createdAt,
                expiresAt: Date.now() + 50000,
            });

            await playBookingSound();
        };

        const handleJobAssigned = async (payload: any) => {
            if (!workingModeRef.current) return; // ✅ Guard added
            removeBookingRequest(payload.bookingId);
            await stopBookingSound();
        };

        const handleTeamBooking = async (payload: any) => {
            if (userRoleRef.current !== UserRole.MULTI_EMPLOYEE) return; // ✅ always fresh
            if (!workingModeRef.current) return;                         // ✅ always fresh

            const coords = parseCoordinates(payload);

            addBookingRequest({
                id: payload.bookingId,
                name: payload.user?.name,
                work: payload.service,
                serviceCategoryName: payload.service,
                address: payload.address,
                coordinates: coords ? [coords.longitude, coords.latitude] : (payload.coordinates || payload.location?.coordinates || payload.userLocation?.coordinates),
                employeeCount: payload.employeeCount,
                isTeam: true,
                teamMembers: payload.teamMembers,
                teamId: payload.teamId,
                cost: payload.totalPrice,
                isScheduled: payload.isScheduled,
                scheduleDateTime: payload.scheduleDateTime,
                createdAt: payload.createdAt,
                expiresAt: Date.now() + 50000,
            });

            await playBookingSound();
        };

        const handleBookingConfirmed = async (payload: any) => {
            const bookingId = payload?.booking?._id || payload?.bookingId;
            if (!bookingId) return;

            await setActiveBookingId(bookingId);
            await stopBookingSound();

            try {
                (navigation as any).navigate("EmployeeTabs", {
                    screen: "BookingStack",
                    params: {
                        screen: "Booking",
                        params: { bookingId }
                    }
                });
            } catch {
                navigation.navigate("BookingStack", {
                    screen: "Booking",
                    params: { bookingId }
                });
            }
        };

        socket.on("new-booking-request", handleNewBooking);
        socket.on("job-assigned", handleJobAssigned);
        socket.on("team-booking-request", handleTeamBooking);
        socket.on("booking-confirmed", handleBookingConfirmed);

        return () => {
            socket.off("new-booking-request", handleNewBooking);
            socket.off("job-assigned", handleJobAssigned);
            socket.off("team-booking-request", handleTeamBooking);
            socket.off("booking-confirmed", handleBookingConfirmed);
        };
    }, []); // ✅ Empty deps — registered once, refs keep values current

    /* ======================================================
       LEADER OTP READY
    ====================================================== */
    useEffect(() => {
        const onLeaderOtpReady = async ({ bookingId }: any) => {
            await stopBookingSound();

            try {
                (navigation as any).navigate("EmployeeTabs", {
                    screen: "BookingStack",
                    params: {
                        screen: "Booking",
                        params: { bookingId }
                    }
                });
            } catch {
                navigation.navigate("BookingStack", {
                    screen: "Booking",
                    params: { bookingId }
                });
            }
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
                await stopBookingSound();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return null;
}