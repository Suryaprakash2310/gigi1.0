import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { WorkingModeToggle } from './WorkingModeToggle';
import { ClientRequestCard } from './ClientRequestCard';
import { theme } from '../../theme/theme';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/EmployeeStack';
import { socket } from '@/socket/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateActiveStatus } from '@/api/activeStatus';
import { BottomSheetType, useBottomSheet } from '@/context/BottomSheetContext';
import { AuthContext } from '@/context/AuthContext';
import { UserRole } from '@/utils/enums/CommonEnum';
import { TeamAssignModal } from '@/components/BottomSheets/TeamAssignEmployeeSheet';
import apiClient from '@/api/client';

type TabNavProp = BottomTabNavigationProp<AppStackParamList, 'BookingStack'>;

const { width } = Dimensions.get('window');

export const EmpDashboard = () => {
  const navigation = useNavigation<TabNavProp>();
  const insets = useSafeAreaInsets();

  const [workingMode, setWorkingMode] = useState(false);
  const [clientRequests, setClientRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { openSheet } = useBottomSheet();
  const { userRole } = useContext(AuthContext);
  const isTeam = userRole === UserRole.MULTI_EMPLOYEE;
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // 🔹 Team assignment modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleWorkingModeToggle = async (value: boolean) => {
    console.log("🔁 Toggle pressed:", value);

    // ❗ SAFETY: employeeId must exist
    if (!employeeId) {
      Alert.alert("Please wait", "Profile is loading");
      console.log("❗ employeeId not loaded yet");
      return;
    }

    // 1️⃣ IMMEDIATE UI UPDATE (optimistic)
    setWorkingMode(value);

    try {
      // 2️⃣ Update backend
      await updateActiveStatus(value);

      // 3️⃣ Socket lifecycle
      if (value) {
        if (!socket.connected) socket.connect();

        if (userRole === UserRole.SINGLE_EMPLOYEE) {
          socket.emit("register-employee", { employeeId });
        }

        if (userRole === UserRole.MULTI_EMPLOYEE) {
          if (!socket.connected) {
            socket.connect();
          }

          socket.once("connect", () => {
            console.log("🟢 SOCKET CONNECTED, registering team:", employeeId);
            socket.emit("register-team", { teamId: employeeId });
          });
        }

      }

      else {
        // 🔴 OFFLINE
        setClientRequests([]);
        socket.disconnect();
        console.log("🔴 Socket disconnected");
      }
    } catch (err) {
      console.error("❌ Toggle failed, reverting", err);

      // 4️⃣ REVERT UI on failure
      // setWorkingMode(!value);

      Alert.alert(
        "Error",
        "Unable to change working mode. Please try again."
      );
      console.log("❌ Reverted workingMode to:", !value);
    }
  };

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
     LOAD EMPLOYEE ID ONCE
  ====================================================== */
  useEffect(() => {
    const loadEmployeeId = async () => {
      const id = await AsyncStorage.getItem('providerId');
      setEmployeeId(id);
    };
    loadEmployeeId();
  }, []);

  /* ======================================================
     SOCKET LISTENERS
  ====================================================== */

  //   useEffect(() => {
  //   if (!employeeId || !workingMode) return;

  //   if (!socket.connected) {
  //     socket.connect();
  //   }

  //   socket.emit("register-employee", {
  //     employeeId,
  //   });

  //   console.log("✅ register-employee emitted:", employeeId);
  //   return () => {
  //     console.log("🔴 Socket inactive");
  //   };
  // }, [employeeId, workingMode]);

  useEffect(() => {
    console.log("🟢 DASHBOARD workingMode:", workingMode);
  }, [workingMode]);
  useEffect(() => {
    if (!workingMode) return;

    socket.on("new-booking-request", ({ payload }) => {
      console.log("📥 New booking request:", payload);

      setClientRequests(prev => {
        if (prev.some(r => r.id === payload.bookingId)) return prev;
        return [
          {
            id: payload.bookingId,
            name: payload.user.name,
            work: payload.service,
            cost: payload.totalPrice,
            address: payload.address,
          },
          ...prev,
        ];
      });
    });

    socket.on("job-assigned", payload => {
      console.log("📦 Job assigned:", payload.bookingId);

      setClientRequests(prev =>
        prev.filter(req => req.id !== payload.bookingId)
      );
    });

    return () => {
      socket.off("new-booking-request");
      socket.off("job-assigned");
    };
  }, [workingMode]);

  useEffect(() => {
    if (userRole !== UserRole.MULTI_EMPLOYEE) return;

    const handleTeamBookingRequest = (payload: any) => {
      console.log("🔥 TEAM BOOKING RECEIVED IN DASHBOARD:", payload);

      setClientRequests(prev => {
        if (prev.some(r => r.id === payload.bookingId)) return prev;

        return [
          {
            id: payload.bookingId,
            name: payload.user.name,
            work: payload.servivce,
            address: payload.address,
            employeeCount: payload.employeeCount,
            isTeam: true,
            teamMembers: payload.teamMembers,
            teamId: payload.teamId,
          },
          ...prev,
        ];
      });
    };

    socket.on("team-booking-request", handleTeamBookingRequest);

    return () => {
      socket.off("team-booking-request", handleTeamBookingRequest);
    };
  }, [userRole]);

  useEffect(() => {
    const onTeamMemberAssigned = (booking: any) => {
      console.log("👥 TEAM MEMBER ASSIGNED:", booking);

      // EVERY MEMBER navigates to booking screen
      navigation.navigate("BookingStack", {
        screen: "Booking",
        params: { bookingId: booking._id },
      });
    };

    socket.on("team-member-assigned", onTeamMemberAssigned);

    return () => {
      socket.off("team-member-assigned", onTeamMemberAssigned);
    };
  }, []);


  //   useEffect(() => {
  //   if (userRole === UserRole.SINGLE_EMPLOYEE) {
  //     socket.on("single-booking-request", handleSingleBooking);
  //   }

  //   if (userRole === UserRole.MULTI_EMPLOYEE) {
  //     socket.on("team-booking-request", handleTeamBooking);
  //   }

  //   return () => {
  //     socket.off("single-booking-request", handleSingleBooking);
  //     socket.off("team-booking-request", handleTeamBooking);
  //   };
  // }, [role]);



  /* ======================================================
     ACCEPT / REJECT HANDLERS
  ====================================================== */
  // const handleAccept = (job: any) => {
  //   if (!employeeId) return;

  //   socket.emit("servicer-accept", {
  //     bookingId: job.id,
  //     employeeId,
  //   });
  //   console.log("✅ servicer-accept emitted:", { bookingId: job.id, employeeId });

  //   Alert.alert("Job Accepted", "Waiting for confirmation...");

  //   // remove from request list
  //   setClientRequests(prev =>
  //     prev.filter(req => req.id !== job.id)
  //   );

  //   navigation.navigate('BookingStack', {
  //     screen: 'Booking',
  //     params: {
  //       bookingId: job.id,
  //       partsbuyed: false
  //     },
  //   });

  //   if (!isTeam) {
  //     socket.emit("servicer-accept", {
  //       bookingId: job.id,
  //       employeeId,
  //     });

  //     setClientRequests(prev => prev.filter(j => j.id !== job.id));

  //     navigation.navigate("BookingStack", {
  //       screen: "Booking",
  //       params: { bookingId: job.id },
  //     });

  //     return;
  //   }

  //   // ✅ MULTI EMPLOYEE
  //   setSelectedJob(job);
  //   setAssignModalVisible(true);
  // };

  const handleAccept = (job: any) => {
    if (!employeeId) return;

    if (isTeam) {
      // 🔥 ONLY OPEN MODAL
      setSelectedJob(job);
      setAssignModalVisible(true);
      return;
    }

    // 🔹 SINGLE EMPLOYEE FLOW
    socket.emit("servicer-accept", {
      bookingId: job.id,
      employeeId,
    });

    setClientRequests(prev => prev.filter(j => j.id !== job.id));

    navigation.navigate("BookingStack", {
      screen: "Booking",
      params: { bookingId: job.id },
    });
  };


  const handleReject = (jobId: string) => {
    if (!employeeId) return;

    socket.emit('servicer-reject', {
      bookingId: jobId,
      employeeId,
    });

    setClientRequests(prev =>
      prev.filter(req => req.id !== jobId)
    );
  };

  /* ======================================================
       MULTIEMPLOYEE SOCKET HANDLERS
    ====================================================== */
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








  /* ======================================================
     HEADER UI (UNCHANGED)
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
            ? 'Good Morning'
            : new Date().getHours() < 18
              ? 'Good Afternoon'
              : 'Good Evening'}
        </Text>
        <Text style={styles.subGreeting}>Surya ..</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {clientRequests.length}
            </Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {workingMode ? 'ON' : 'OFF'}
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
          <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={clientRequests}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }) => (
            <ClientRequestCard
              data={item}
              role={item.isTeam ? "team_owner" : "employee"}
              index={index}
              employeeCount={item.employeeCount}
              teamMembers={item.teamMembers}
              onReject={() => handleReject(item.id)}
              onAccept={() => handleAccept(item)}
            // onTeamAccept={({ leaderEmpId, helperEmpIds }) => {
            //   // FINAL TEAM ASSIGN
            //   apiClient.post("/booking/team/assign", {
            //     bookingId: item.id,
            //     primaryEmployee: leaderEmpId,
            //     helpers: helperEmpIds,
            //   }).then(() => {
            //     setClientRequests(prev =>
            //       prev.filter(j => j.id !== item.id)
            //     );

            //     navigation.navigate("BookingStack", {
            //       screen: "Booking",
            //       params: { bookingId: item.id },
            //     });
            //   });
            // }}
            />

          )}
          contentContainerStyle={[styles.scrollArea, { paddingBottom: 80 + insets.bottom }]}
        />
      )}
      {/* 🔹 TEAM ASSIGN MODAL */}
      <TeamAssignModal
        visible={assignModalVisible}
        booking={selectedJob}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedJob(null);
        }}
        onSuccess={() => {
          setClientRequests(prev =>
            prev.filter(j => j.id !== selectedJob.id)
          );

          navigation.navigate("BookingStack", {
            screen: "Booking",
            params: { bookingId: selectedJob.id },
          });
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
