import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  Modal,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../../components/AppHeader";
import { RequestCard } from "../../components/toolshop/RequestCard";
import { socket } from "@/socket/socket";
import { WorkingModeToggle } from "../EmpDashboard/WorkingModeToggle";
import { fetchPartRequestById } from "@/api/parts.api";
import OtpInput from "../../components/OtpInput";
import { LiveTrackerModal } from "../../components/toolshop/LiveTrackerModal";

export const ToolShopDashboard = () => {
  const [workingMode, setWorkingMode] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  /* ===============================
     LOAD SHOP ID
  =============================== */
  useEffect(() => {
    AsyncStorage.getItem("providerId").then(setShopId);
  }, []);

  /* ===============================
     SOCKET: RECEIVE REQUEST
  =============================== */
  useEffect(() => {
    const handler = async ({ requestId }: { requestId: string }) => {
      const request = await fetchPartRequestById(requestId);

      setIncomingRequests(prev => {
        if (prev.some(r => r.requestId === request._id)) return prev;
        return [{ ...request, requestId: request._id }, ...prev];
      });
    };
    console.log("----------", incomingRequests);

    socket.on("toolshop-booking-request", handler);
    return () => {
      socket.off("toolshop-booking-request", handler);
    };
  }, []);

  /* ===============================
     WORKING MODE
  =============================== */
  const handleToggle = (value: boolean) => {
    setWorkingMode(value);

    if (value && !socket.connected) {
      socket.connect();
      socket.emit("register-toolshop", { shopId });
    }

    if (!value) {
      socket.disconnect();
      setIncomingRequests([]);
      setAcceptedRequests([]);
    }
  };

  /* ===============================
     ACCEPT REQUEST
  =============================== */
  const accept = (req: any) => {
    socket.emit("toolshop-accept", {
      requestId: req.requestId,
      shopId,
    });

    setIncomingRequests(prev =>
      prev.filter(r => r.requestId !== req.requestId)
    );

    setAcceptedRequests(prev => [
      { ...req, status: "READY_FOR_PICKUP" },
      ...prev,
    ]);
  };

  /* ===============================
     REJECT REQUEST
  =============================== */
  const reject = (req: any) => {
    socket.emit("toolshop-reject", {
      requestId: req.requestId,
      shopId,
    });

    setIncomingRequests(prev =>
      prev.filter(r => r.requestId !== req.requestId)
    );
  };

  /* ===============================
     OPEN OTP MODAL
  =============================== */
  const openOtp = (req: any) => {
    setActiveRequest(req);
    setOtpModalVisible(true);
  };

  const verifyOtp = (otp: string) => {
    if (!activeRequest) return;

    console.log("📤 Verifying OTP:", otp);

    socket.emit("verify-part-otp", {
      requestId: activeRequest.requestId,
      otp,
    });
  };



  /* ===============================
     OTP SOCKET RESULT
  =============================== */
  useEffect(() => {
    const onSuccess = () => {
      Alert.alert("Success", "Parts handed over successfully");

      // Close modal
      setOtpModalVisible(false);

      // Remove from accepted list
      setAcceptedRequests(prev =>
        prev.filter(r => r.requestId !== activeRequest?.requestId)
      );

      setActiveRequest(null);
    };

    const onFailed = ({ message }: any) => {
      Alert.alert("Invalid OTP", message || "Try again");
    };

    socket.on("part-otp-success", onSuccess);
    socket.on("otp-failed", onFailed);

    return () => {
      socket.off("part-otp-success", onSuccess);
      socket.off("otp-failed", onFailed);
    };
  }, [activeRequest]);




  const [trackModalVisible, setTrackModalVisible] = useState(false);
  const [trackLocation, setTrackLocation] = useState<any>(null);
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);

  /* ===============================
     TRACKING SOCKET
  =============================== */
  useEffect(() => {
    // Join the tracking room for any active request
    if (activeTrackingId) {
      socket.emit("join-tracking", { bookingId: activeTrackingId });
      console.log(`🔌 Joining room: ${activeTrackingId}`);
    }

    const handleLocation = (data: any) => {
      console.log("📍 Location Update:", data);

      // Check if update matches our tracked booking
      if (activeTrackingId && data.bookingId === activeTrackingId) {
        setTrackLocation(data); // data contains { latitude, longitude, eta... } directly
      }
    };

    // Listen to the new event name
    socket.on("servicer-location-update", handleLocation);

    // Keep old ones just in case backend emits them temporarily
    socket.on("receive-location", handleLocation);

    return () => {
      socket.off("servicer-location-update", handleLocation);
      socket.off("receive-location", handleLocation);
    };
  }, [activeTrackingId]);

  const openTracker = (req: any) => {
    setActiveTrackingId(req.requestId);
    setTrackModalVisible(true);
    setTrackLocation(null); // Clear previous
  };

  /* ===============================
     UI
  =============================== */
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Tool Shop Dashboard" />

      <View style={{ padding: 16 }}>
        <WorkingModeToggle value={workingMode} onToggle={handleToggle} />
      </View>

      {/* INCOMING REQUESTS */}
      <Text style={styles.sectionTitle}>Incoming Requests</Text>
      <FlatList
        data={incomingRequests}
        keyExtractor={item => item.requestId.toString()}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            mode="incoming"
            onAccept={() => accept(item)}
            onReject={() => reject(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No incoming requests</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* ACCEPTED REQUESTS */}
      <Text style={styles.sectionTitle}>Waiting Pickup</Text>
      <FlatList
        data={acceptedRequests}
        keyExtractor={item => item.requestId.toString()}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            mode="pickup"
            onVerify={() => openOtp(item)}
            onTrack={() => openTracker(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No accepted requests</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* OTP MODAL */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify Pickup OTP</Text>

            <OtpInput
              otpLength={4}
              onOtpComplete={verifyOtp}
            />

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setOtpModalVisible(false);
                setActiveRequest(null);
              }}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LIVE TRACKER MODAL */}
      <LiveTrackerModal
        visible={trackModalVisible}
        onClose={() => {
          setTrackModalVisible(false);
          setActiveTrackingId(null);
        }}
        location={trackLocation}
      />

    </View>
  );
};

/* ===============================
   STYLES
=============================== */
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 16,
    marginTop: 10,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 20,
    alignItems: "center",
  },
});
