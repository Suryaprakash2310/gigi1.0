import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Screen } from "../../components/ui/Screen";
import { AppText } from "../../components/ui/Text";
import { useNavigation } from "@react-navigation/native";
import { useTeam } from "../../hooks/useTeam";
import { TeamAPI } from "@/api/team";
import { PendingRequestCard } from "@/components/team/PendingRequestCard";
import { MemberCard } from "@/components/team/AddMemberCard";
import { useFocusEffect } from "@react-navigation/native";



export const TeamEmployeeScreen: React.FC = () => {
  const { members, pendingRequests, loading, refreshTeam } = useTeam();
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      refreshTeam();
    }, [])
  );

  const handleRemove = async (empId: string) => {
    try {
      const res = await TeamAPI.removeMember(empId);
      Alert.alert("Removed", res.message);
      await refreshTeam();  // <-- refresh profile (team auto-updates)
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to remove employee"
      );
    }
  };

  return (
    <Screen>
      <AppText variant="titleLarge" style={styles.title}>
        Team Dashboard
      </AppText>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="titleMedium" style={styles.sectionTitle}>
            Pending Requests
          </AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingRequests.length === 0 ? (
              <AppText style={{ opacity: 0.6 }}>No pending requests</AppText>
            ) : (
              pendingRequests.map((item) => (
                <PendingRequestCard
                  key={item.empId}
                  empId={item.empId}
                  fullname={item.fullname}
                />
              ))
            )}
          </ScrollView>

          <AppText variant="titleMedium" style={styles.sectionTitle}>
            Your Employees
          </AppText>

          {members.length === 0 ? (
            <AppText style={{ opacity: 0.6 }}>No employees added yet</AppText>
          ) : (
            members.map((item) => (
              <MemberCard
                key={item.empId}
                empId={item.empId}
                fullname={item.fullname}
                onRemove={() => handleRemove(item.empId)}
              />
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("AddEmp")}
        style={styles.fab}
      >
        <AppText style={styles.fabText}>+ Add Employee</AppText>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { marginBottom: 16, fontWeight: "700" },
  sectionTitle: { marginBottom: 10, marginTop: 10, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
