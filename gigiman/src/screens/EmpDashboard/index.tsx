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
import { ProfileContext } from "@/context/ProfileContext";
import { socket } from "@/socket/socket";

type TabNavProp = BottomTabNavigationProp<AppStackParamList, "BookingStack">;
const { width } = Dimensions.get("window");

export const EmpDashboard = () => {
  const navigation = useNavigation<TabNavProp>();
  const insets = useSafeAreaInsets();
  const { userRole } = useContext(AuthContext);
  const { profile } = useContext(ProfileContext);

  const {
    clientRequests,
    workingMode,
    setWorkingMode,
    removeBookingRequest,
    activeBookingId,
    setActiveBookingId,
  } = useProviderBooking();

  const isTeam = userRole === UserRole.MULTI_EMPLOYEE;

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ownerAvailable, setOwnerAvailable] = useState(true);
  const [fetchedMembers, setFetchedMembers] = useState<any[]>([]);
  
  const refreshMembers = async () => {
    if (isTeam) {
      try {
        const { default: apiClient } = await import('@/api/client');
        const res = await apiClient.get<{ members: any[], ownerAvailable: boolean }>("/multipleemployee/members");
        setFetchedMembers(res.data.members || []);
        setOwnerAvailable(res.data.ownerAvailable !== false);
      } catch (err) {
        console.error("Failed to load team members:", err);
      }
    }
  };

  useEffect(() => {
    refreshMembers();
  }, [isTeam, clientRequests.length]); // Refresh when team mode or requests count changes

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
  // useEffect(() => {
  //   const onLeaderOtpReady = ({ bookingId }: any) => {
  //     console.log("🟢 LEADER OTP READY:", bookingId);
  //     navigation.navigate("BookingStack", {
  //       screen: "Booking",
  //       params: { bookingId }
  //     });
  //   };
  //   socket.on("leader-otp-ready", onLeaderOtpReady);
  //   return () => {
  //     socket.off("leader-otp-ready", onLeaderOtpReady);
  //   };
  // }, []);

  // 🔄 RESTORE FLOW: If app was killed and restarted, check for active booking
  useEffect(() => {
    if (activeBookingId) {
      console.log("🚀 Redirecting to active booking:", activeBookingId);
      navigation.navigate("BookingStack", {
        screen: "Booking",
        params: { bookingId: activeBookingId }
      });
    }
  }, [activeBookingId]);

  /* ======================================================
     ACCEPT / REJECT
  ====================================================== */

  const handleAccept = async (job: any) => {
    if (isTeam) {
      const teamSize = profile?.members?.length || 0;
      const totalCapacity = teamSize + 1; // leader + helpers

      // If the team has MORE members than the job requires, they must manually select who goes.
      if (totalCapacity > job.employeeCount) {
        // Team owner: open assignment modal
        setSelectedJob(job);
        setAssignModalVisible(true);
        return;
      }

      // If the team's total capacity is exactly the job requirement (or less),
      // we can skip the manual assignment modal. The backend will auto-assign.
      console.log("📤 EMITTING team-accept (auto-assign):", job.id);
      socket.emit("team-accept", {
        bookingId: job.id,
        teamId: profile?._id,
      });

      removeBookingRequest(job.id);
      await stopBookingSound();
      
      Alert.alert("Job Accepted", "The team has been auto-assigned. Primary employee will be navigated shortly.");
      return;
    }

    // Single employee: accept and navigate directly
    console.log("📤 EMITTING servicer-accept:", job.id);
    socket.emit("servicer-accept", {
      bookingId: job.id,
    });
    setActiveBookingId(job.id); // 🔥 Persist ID as soon as accepted
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
      <AppHeader
        title="Gigiman"
        showBack={false}
        rightIcon="notifications-outline"
        onRightPress={() => navigation.navigate("NotificationScreen" as never)}
      />
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
              teamMembers={
                profile
                  ? [
                      ...(ownerAvailable ? [{ _id: profile._id, fullname: profile.fullname || profile.ownerName || profile.name || "Me (Owner)" }] : []),
                      ...fetchedMembers,
                    ]
                  : fetchedMembers
              }
              onReject={() => handleReject(item.id)}
              onAccept={() => handleAccept(item)}
              onTeamAccept={({ leaderEmpId, helperEmpIds }) => {
                socket.emit("team-accept", {
                  bookingId: item.id,
                  teamId: profile?._id,
                  leaderEmpId,
                  helperEmpIds,
                });
                removeBookingRequest(item.id);
                stopBookingSound();
                Alert.alert("Job Accepted", "The team has been assigned. Primary employee will be navigated shortly.");
              }}
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
