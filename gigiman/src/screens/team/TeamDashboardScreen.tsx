import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { AppText } from "../../components/ui/Text";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTeam } from "../../hooks/useTeam";
import { TeamAPI } from "@/api/team";
import { PendingRequestCard } from "@/components/team/PendingRequestCard";
import { MemberCard } from "@/components/team/AddMemberCard";
import { theme } from "@/theme/theme";
import AppHeader from "@/components/AppHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";



export const TeamEmployeeScreen: React.FC = () => {
  const { members, pendingRequests, loading, refreshTeam } = useTeam();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      refreshTeam();
    }, [])
  );

  const handleRemove = async (empId: string) => {
    try {
      const res = await TeamAPI.removeMember(empId);
      Alert.alert("Removed", res.message);
      await refreshTeam();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to remove employee"
      );
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Team Dashboard"
        subtitle="Manage your team members"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* PENDING REQUESTS */}
          <View style={styles.section}>
            <AppText variant="titleMedium" style={styles.sectionTitle}>
              Pending Requests
            </AppText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <AppText style={styles.emptyText}>No pending requests</AppText>
                </View>
              ) : (
                pendingRequests.map((item) => (
                  <View key={item.empId} style={{ marginRight: 12 }}>
                    <PendingRequestCard
                      empId={item.empId}
                      fullname={item.fullname}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* EMPLOYEES LIST */}
          <View style={styles.section}>
            <AppText variant="titleMedium" style={styles.sectionTitle}>
              Your Employees
            </AppText>

            {members.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppText style={styles.emptyText}>No employees added yet</AppText>
                <AppText style={styles.emptySubText}>Tap the + button to add new members</AppText>
              </View>
            ) : (
              members.map((item) => (
                <View key={item.empId} style={styles.memberWrapper}>
                  <MemberCard
                    empId={item.empId}
                    fullname={item.fullname}
                    onRemove={() => handleRemove(item.empId)}
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("AddEmp")}
        style={[styles.fab, { bottom: 28 + insets.bottom }]}
      >
        <AppText style={styles.fabText}>+ Add Employee</AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  memberWrapper: {
    marginBottom: 12,
  },
  emptyCard: {
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    borderRadius: 12,
    alignItems: 'center',
    width: 200,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
  },
  emptySubText: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
