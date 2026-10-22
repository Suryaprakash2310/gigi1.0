import React, { useState, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import { stopBookingSound } from "@/utils/BookingSoundManager";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { WorkingModeToggle } from "./WorkingModeToggle";
import { ClientRequestCard } from "./ClientRequestCard";
import { theme } from "../../theme/theme";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppStackParamList } from "../../navigation/EmployeeStack";
import { updateActiveStatus } from "@/api/activeStatus";
import { AuthContext } from "@/context/AuthContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import { TeamAssignModal } from "@/components/BottomSheets/TeamAssignEmployeeSheet";
import { useProviderBooking } from "@/context/ProviderBookingContext";
import { ProfileContext } from "@/context/ProfileContext";
import { BookingHistoryContext } from "@/context/BookingHistoryContext";
import { socket } from "@/socket/socket";
import * as Location from "expo-location";

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

  const { bookings, stats: historyStats, refresh: refreshBookingHistory } =
    useContext(BookingHistoryContext);

  const refreshBookingHistoryRef = useRef(refreshBookingHistory);
  useEffect(() => {
    refreshBookingHistoryRef.current = refreshBookingHistory;
  }, [refreshBookingHistory]);

  // Refresh booking stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshBookingHistoryRef.current?.();
    }, [])
  );

  // Listen to socket cancellation/completion events to refresh stats in real-time
  useEffect(() => {
    const handleSocketUpdate = () => {
      refreshBookingHistoryRef.current?.();
    };

    socket.on("booking-cancelled-by-user", handleSocketUpdate);
    socket.on("user-cancel-booking", handleSocketUpdate);
    socket.on("booking-confirmed", handleSocketUpdate);

    return () => {
      socket.off("booking-cancelled-by-user", handleSocketUpdate);
      socket.off("user-cancel-booking", handleSocketUpdate);
      socket.off("booking-confirmed", handleSocketUpdate);
    };
  }, []);

  const isSameDayAsToday = (dateValue: any): boolean => {
    if (!dateValue) return false;
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayStats = useMemo(() => {
    let completedCount = 0;
    let cancelledCount = 0;

    (bookings || []).forEach((b) => {
      const s = (b.status || "").toUpperCase();

      // Check for completion today
      if (s === "COMPLETED") {
        const compDate =
          (b as any).completedAt ||
          (b as any).updatedAt ||
          b.scheduleDateTime ||
          b.createdAt;
        if (isSameDayAsToday(compDate)) {
          completedCount += 1;
        }
      }

      // Check for cancellation / rejection today
      if (s === "CANCELLED" || s === "CANCELED" || s === "REJECTED") {
        const cancelDate =
          (b as any).cancelledAt ||
          (b as any).updatedAt ||
          b.createdAt;
        if (isSameDayAsToday(cancelDate)) {
          cancelledCount += 1;
        }
      }
    });

    const backendTodayCompleted =
      (historyStats as any)?.todayCompleted ??
      (historyStats as any)?.todayCompletedJobs;
    const backendTodayCancelled =
      (historyStats as any)?.todayCancelled ??
      (historyStats as any)?.todayCancelledJobs ??
      (historyStats as any)?.todayCancellations;

    return {
      completed:
        typeof backendTodayCompleted === "number"
          ? backendTodayCompleted
          : completedCount,
      cancelled:
        typeof backendTodayCancelled === "number"
          ? backendTodayCancelled
          : cancelledCount,
    };
  }, [bookings, historyStats]);

  const handleViewCompletedHistory = () => {
    try {
      (navigation as any).navigate("RecentBookingHistory", {
        initialFilter: "COMPLETED",
      });
    } catch (e) {
      console.warn("Could not navigate to RecentBookingHistory:", e);
    }
  };

  const handleViewCancelledHistory = () => {
    try {
      (navigation as any).navigate("RecentBookingHistory", {
        initialFilter: "CANCELLED",
      });
    } catch (e) {
      console.warn("Could not navigate to RecentBookingHistory:", e);
    }
  };

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

  const navigateToBooking = (bookingId: string) => {
    if (!bookingId) return;
    try {
      (navigation as any).navigate("BookingStack", {
        screen: "Booking",
        params: { bookingId },
      });
    } catch (e1) {
      try {
        (navigation as any).navigate("EmployeeTabs", {
          screen: "BookingStack",
          params: {
            screen: "Booking",
            params: { bookingId },
          },
        });
      } catch (e2) {
        console.error("Navigation error to BookingStack:", e2);
      }
    }
  };

  // 🔄 RESTORE FLOW: If app was killed and restarted, check for active booking
  useEffect(() => {
    if (activeBookingId) {
      navigateToBooking(activeBookingId);
    }
  }, [activeBookingId]);

  /* ======================================================
     ACCEPT / REJECT
  ====================================================== */

  const handleAccept = async (job: any) => {
    const targetBookingId = job?.id || job?._id || job?.bookingId;
    if (!targetBookingId) {
      console.warn("No booking ID found for job", job);
      return;
    }

    // 1. Immediately remove from incoming list so UI doesn't stutter or show duplicate
    removeBookingRequest(targetBookingId);

    // 2. Stop alert sound immediately
    await stopBookingSound();

    // 3. Persist active booking ID in context and storage
    await setActiveBookingId(targetBookingId);

    // 4. Try to get location with a fast non-blocking timeout (max 1 second) or last known location
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      const loc = (await Promise.race([
        Location.getLastKnownPositionAsync(),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
      ])) as any;
      if (loc?.coords) {
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
    } catch {
      // Ignore location error, accept should NEVER be blocked by GPS
    }

    if (isTeam) {
      const teamSize = profile?.members?.length || 0;
      const totalCapacity = teamSize + 1; // leader + helpers

      // If the team has MORE members than the job requires, they must manually select who goes.
      if (totalCapacity > (job.employeeCount || 1)) {
        // Team owner: open assignment modal
        setSelectedJob(job);
        setAssignModalVisible(true);
        return;
      }

      // If the team's total capacity is exactly the job requirement (or less),
      // we can skip the manual assignment modal. The backend will auto-assign.
      socket.emit("team-accept", {
        bookingId: targetBookingId,
        teamId: profile?._id || profile?.id,
        latitude,
        longitude,
      });

      Alert.alert("Job Accepted", "The team has been auto-assigned.");
      navigateToBooking(targetBookingId);
      return;
    }

    // Single employee: accept and navigate directly
    socket.emit("servicer-accept", {
      bookingId: targetBookingId,
      latitude,
      longitude,
    });

    navigateToBooking(targetBookingId);
  };

  const handleReject = async (jobId: string) => {
    socket.emit("servicer-reject", {
      bookingId: jobId,
    });

    removeBookingRequest(jobId);

    // 🔇 Stop alert sound on reject
    await stopBookingSound();

    refreshBookingHistory?.();
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

        <View style={styles.statsGrid}>
          {/* Row 1: Active Jobs & Mode */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>
                  {clientRequests.length}
                </Text>
              </View>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Ionicons
                  name={workingMode ? "radio-button-on" : "radio-button-off"}
                  size={16}
                  color={workingMode ? "#10B981" : "#94A3B8"}
                  style={styles.statIcon}
                />
                <Text
                  style={[
                    styles.statValue,
                    { color: workingMode ? "#10B981" : "#64748B" },
                  ]}
                >
                  {workingMode ? "ON" : "OFF"}
                </Text>
              </View>
              <Text style={styles.statLabel}>Mode</Text>
            </View>
          </View>

          {/* Row 2: Today's Completion & Cancellation Counts */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statBox, styles.statBoxCompleted]}
              activeOpacity={0.7}
              onPress={handleViewCompletedHistory}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#10B981"
                  style={styles.statIcon}
                />
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  {todayStats.completed}
                </Text>
              </View>
              <Text style={styles.statLabel}>Today Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statBox, styles.statBoxCancelled]}
              activeOpacity={0.7}
              onPress={handleViewCancelledHistory}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#EF4444"
                  style={styles.statIcon}
                />
                <Text style={[styles.statValue, { color: "#EF4444" }]}>
                  {todayStats.cancelled}
                </Text>
              </View>
              <Text style={styles.statLabel}>Today Cancelled</Text>
            </TouchableOpacity>
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
              role={isTeam ? "team_owner" : "employee"}
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
                const targetBookingId = item.id || (item as any)._id || (item as any).bookingId;
                socket.emit("team-accept", {
                  bookingId: targetBookingId,
                  teamId: profile?._id || profile?.id,
                  leaderEmpId,
                  helperEmpIds,
                });
                setActiveBookingId(targetBookingId);
                removeBookingRequest(targetBookingId);
                stopBookingSound();
                navigateToBooking(targetBookingId);
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
          const targetBookingId = selectedJob?.id || selectedJob?._id || selectedJob?.bookingId;
          if (targetBookingId) {
            setActiveBookingId(targetBookingId);
            removeBookingRequest(targetBookingId);
            stopBookingSound();
            navigateToBooking(targetBookingId);
          }
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
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  statsGrid: {
    marginTop: 16,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statBoxCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statBoxCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginRight: 6,
  },
  statValue: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: width * 0.032,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
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
