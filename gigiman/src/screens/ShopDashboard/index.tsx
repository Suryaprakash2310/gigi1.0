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
import { useToolShop } from "@/context/ToolShopContext";

export const ToolShopDashboard = () => {
  const {
    workingMode,
    toggleWorkingMode,
    incomingRequests,
    acceptedRequests,
    acceptRequest,
    rejectRequest,
    verifyOtp,
    trackingId,
    setTrackingId,
    trackLocation,
    activeRequest,
    setActiveRequest,
    otpModalVisible,
    setOtpModalVisible,
  } = useToolShop();

  // const [otpModalVisible, setOtpModalVisible] = useState(false);
  // const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [trackModalVisible, setTrackModalVisible] = useState(false);

  /* ===============================
     OPEN OTP
  =============================== */
  const openOtp = (req: any) => {
    setActiveRequest(req);
    setOtpModalVisible(true);
  };

  const handleVerifyOtp = (otp: string) => {
    if (!activeRequest) return;

    verifyOtp(activeRequest.requestId, otp);

    setOtpModalVisible(false);
    setActiveRequest(null);
  };

  /* ===============================
     OPEN TRACKER
  =============================== */
  const openTracker = (req: any) => {
    setTrackingId(req.requestId);
    setTrackModalVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Tool Shop Dashboard" />

      <View style={{ padding: 16 }}>
        <WorkingModeToggle
          value={workingMode}
          onToggle={toggleWorkingMode}
        />
      </View>

      {/* INCOMING */}
      <Text style={styles.sectionTitle}>Incoming Requests</Text>
      <FlatList
        data={incomingRequests}
        keyExtractor={(item) => item.requestId.toString()}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            mode="incoming"
            onAccept={() => acceptRequest(item)}
            onReject={() => rejectRequest(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No incoming requests</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      {/* ACCEPTED */}
      <Text style={styles.sectionTitle}>Waiting Pickup</Text>
      <FlatList
        data={acceptedRequests}
        keyExtractor={(item) => item.requestId.toString()}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            mode="pickup"
            onVerify={() => openOtp(item)}
            onTrack={() => openTracker(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No accepted requests</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      {/* OTP MODAL */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify Pickup OTP</Text>

            <OtpInput
              otpLength={4}
              onOtpComplete={handleVerifyOtp}
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

      {/* TRACKER MODAL */}
      <LiveTrackerModal
        visible={trackModalVisible}
        onClose={() => {
          setTrackModalVisible(false);
          setTrackingId(null);
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
