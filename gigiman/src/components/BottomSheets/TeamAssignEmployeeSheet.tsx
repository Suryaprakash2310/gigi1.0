import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import apiClient from "@/api/client";
import { socket } from "@/socket/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TeamAssignModal = ({
  visible,
  booking,
  onClose,
  onSuccess,
}: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [primary, setPrimary] = useState<string | null>(null);
  const [helpers, setHelpers] = useState<string[]>([]);
  const requiredCount = booking?.employeeCount ?? 1;
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;

    const loadMembers = async () => {
      const res = await apiClient.get<{ members: any[] }>("/multipleemployee/members");
      setMembers(res.data.members);
    };

    loadMembers();
  }, [visible]);
  useEffect(() => {
    const loadEmployeeId = async () => {
      const id = await AsyncStorage.getItem('providerId');
      setEmployeeId(id);
    };
    loadEmployeeId();
  }, []);

  const toggleHelper = (id: string) => {
  setHelpers(prev => {
    if (prev.includes(id)) {
      return prev.filter(h => h !== id);
    }

    if (prev.length >= requiredCount - 1) {
      Alert.alert(
        "Limit reached",
        `Only ${requiredCount - 1} helpers allowed`
      );
      return prev;
    }

    return [...prev, id];
  });
};


 const submit = async () => {
  if (!primary) {
    Alert.alert("Select leader");
    return;
  }

  if (helpers.length + 1 !== requiredCount) {
    Alert.alert(
      "Invalid selection",
      `Select ${requiredCount - 1} helpers`
    );
    return;
  }

  try {
    console.log("🚀 TEAM ACCEPT API", {
      bookingId: booking.id,
      teamId: booking.teamId,
      leaderEmpId: primary,
      helperEmpIds: helpers,
    });

    // await apiClient.post("/booking/team/assign", {
    //   bookingId: booking.id,
    //   teamId: booking.teamId,      // 🔥 FROM DASHBOARD
    //   leaderEmpId: primary,        // 🔥 empId
    //   helperEmpIds: helpers,        // 🔥 empId[]
    // });

    socket.emit("team-accept", {
      bookingId: booking.id,
      teamId: booking.teamId,
      leaderEmpId: primary,        // 🔥 empId
      helperEmpIds: helpers,
    });

    onSuccess();
    onClose();

  } catch (err: any) {
    console.error("❌ TEAM ACCEPT ERROR", err?.response?.data || err);
    Alert.alert(
      "Error",
      err?.response?.data?.message || "Failed to assign team"
    );
  }
};


  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Assign Team</Text>

          <Text style={styles.section}>Primary Employee</Text>
          {members.map(m => (
            <TouchableOpacity
              key={m._id}
              style={[
                styles.item,
                primary === m._id && styles.selected,
              ]}
              onPress={() => {
                setPrimary(m._id);
                setHelpers([]);
              }}
            >
              <Text>{m.fullname}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.section}>
            Helpers ({requiredCount - 1})
          </Text>

          {members
            .filter(m => m._id !== primary)
            .map(m => (
              <TouchableOpacity
                key={m._id}
                style={[
                  styles.item,
                  helpers.includes(m._id) && styles.selected,
                ]}
                onPress={() => toggleHelper(m._id)}
              >
                <Text>{m.fullname}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity style={styles.submit} onPress={submit}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Confirm Assignment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  section: {
    marginTop: 10,
    fontWeight: "600",
  },
  item: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 8,
  },
  selected: {
    backgroundColor: "#DCFCE7",
    borderColor: "#22C55E",
  },
  submit: {
    backgroundColor: "#22C55E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  cancel: {
    textAlign: "center",
    marginTop: 10,
    color: "#EF4444",
  },
});
