import React, { useState, useContext, useEffect } from "react";
import { stopBookingSound } from "@/utils/BookingSoundManager";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { WorkingModeToggle } from "./WorkingModeToggle";
import { ClientRequestCard } from "./ClientRequestCard";
import { theme } from "../../theme/theme";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/EmployeeStack";
import { updateActiveStatus } from "@/api/activeStatus";
import { AuthContext } from "@/context/AuthContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import { TeamAssignModal } from "@/components/BottomSheets/TeamAssignEmployeeSheet";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { socket } from "@/socket/socket";

type TabNavProp = BottomTabNavigationProp<AppStackParamList, "BookingStack">;
const { width } = Dimensions.get("window");

export const EmpDashboard = () => {
  const navigation = useNavigation<TabNavProp>();
  const insets = useSafeAreaInsets();
  const { userRole } = useContext(AuthContext);

  const {
    clientRequests,
    workingMode,
    setWorkingMode,
    removeBookingRequest,
  } = useProviderBooking();

  const isTeam = userRole === UserRole.MULTI_EMPLOYEE;

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ======================================================
     WORKING MODE TOGGLE (PRODUCTION SAFE)
  ====================================================== */
  const handleWorkingModeToggle = async (value: boolean) => {
    try {
      setWorkingMode(value);
      await updateActiveStatus(value);

      if (!value) {
        // Clear UI when offline
        removeAllRequests();
        // 🔇 Stop alert sound when going offline
        await stopBookingSound();
      }
    } catch (err) {
      Alert.alert("Error", "Unable to change working mode");
      setWorkingMode(!value);
    }
  };

  const removeAllRequests = () => {
    clientRequests.forEach((job) => {
      removeBookingRequest(job.id);
    });
  };

  // Only primary employee (team leader) should navigate after assignment
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

  /* ======================================================
     ACCEPT / REJECT
  ====================================================== */

  const handleAccept = async (job: any) => {
    if (isTeam) {
      // Team owner: open assignment modal, do not navigate here
      setSelectedJob(job);
      setAssignModalVisible(true);
      return;
    }

    // Single employee: accept and navigate directly
    console.log("📤 EMITTING servicer-accept:", job.id);
    socket.emit("servicer-accept", {
      bookingId: job.id,
    });
    removeBookingRequest(job.id);

    // 🔇 Stop alert sound on accept
    await stopBookingSound();

    console.log("✅ Employee accepted job, navigating to booking:", job.id);
    navigation.navigate("BookingStack", {
      screen: "Booking",
      params: { bookingId: job.id },
    });
  }

  const handleReject = async (jobId: string) => {
    socket.emit("servicer-reject", {
      bookingId: jobId,
    });

    removeBookingRequest(jobId);

    // 🔇 Stop alert sound on reject
    await stopBookingSound();
  };

  /* ======================================================
  // useEffect(() => {
  //   if (!workingMode) return;

  //   const handleTeamBooking = (payload: any) => {
  //     if (userRole !== UserRole.MULTI_EMPLOYEE) return;

  //     openSheet(BottomSheetType.TEAM_ASSIGN_EMPLOYEES, {
  //       bookingId: payload.bookingId,
  //       teamId: payload.teamId,
  //       employeeCount: payload.employeeCount,
  //       teamMembers: payload.teamMembers,
  //     });
  //   };

  //   socket.on("team-booking-request", handleTeamBooking);

  //   return () => {
  //     socket.off("team-booking-request", handleTeamBooking);
  //   };
  // }, [workingMode, userRole]);
     HEADER UI
  ====================================================== */

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <WorkingModeToggle
        value={workingMode}
        onToggle={handleWorkingModeToggle}
      />

      <View style={styles.summaryContainer}>
        <Text style={styles.greeting}>
          {new Date().getHours() < 12
            ? "Good Morning"
            : new Date().getHours() < 18
              ? "Good Afternoon"
              : "Good Evening"}
        </Text>

        <Text style={styles.subGreeting}>
          Gigiman Service Providers ..
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {clientRequests.length}
            </Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {workingMode ? "ON" : "OFF"}
            </Text>
            <Text style={styles.statLabel}>Mode</Text>
          </View>
        </View>
      </View>
    </View>
  );

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <View style={styles.container}>
      <AppHeader title="Gigiman" showBack={false} />
      {renderHeader()}

      {!workingMode ? (
        <View style={styles.offlineContainer}>
          <View style={styles.offlineContent}>
            <Text style={styles.offlineText}>You are Offline</Text>
            <Text style={styles.offlineSubText}>
              Switch to Working Mode to receive jobs
            </Text>
          </View>
        </View>
      ) : loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clientRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ClientRequestCard
              data={{ ...item, cost: String(item.cost) }}
              role={item.isTeam ? "team_owner" : "employee"}
              index={index}
              employeeCount={item.employeeCount}
              teamMembers={item.teamMembers}
              onReject={() => handleReject(item.id)}
              onAccept={() => handleAccept(item)}
            />
          )}
          contentContainerStyle={{
            paddingBottom: 80 + insets.bottom,
          }}
        />
      )}

      <TeamAssignModal
        visible={assignModalVisible}
        booking={selectedJob}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedJob(null);
        }}
        onSuccess={() => {
          // Only primary employee (team leader) should navigate to booking
          removeBookingRequest(selectedJob.id);
          Alert.alert("Assignment Complete", "Primary employee will be navigated to booking screen.");
          // Navigation to booking screen should be triggered by the primary employee after assignment
          setAssignModalVisible(false);
          setSelectedJob(null);
        }}
      />
    </View>
  );
};
/* ======================================================
   STYLES (UNCHANGED)
====================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4f4ff' },
  headerContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: 10,
    paddingBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  greeting: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: width * 0.04,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: width * 0.38,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: width * 0.035,
    color: '#777',
    marginTop: 3,
  },
  scrollArea: { paddingBottom: 80 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineContainer: { flex: 1, backgroundColor: '#fff' },
  offlineContent: { alignItems: 'center', marginTop: 100 },
  offlineText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#444',
  },
  offlineSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
});
