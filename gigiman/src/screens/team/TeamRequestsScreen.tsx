import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { AppText } from "@/components/ui/Text";
import { useTeamRequests } from "@/hooks/useTeamRequest";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export const TeamRequestsScreen = () => {
  const { requests, myTeam, loading, accept, reject, leave } =
    useTeamRequests();

  const handleAccept = async () => {
    try {
      await accept();
      Alert.alert("Success", "Joined the team successfully");
    } catch {
      Alert.alert("Error", "Could not accept request");
    }
  };

  const handleReject = async (teamId: string) => {
    try {
      await reject(teamId);
      Alert.alert("Rejected", "Request rejected");
    } catch {
      Alert.alert("Error", "Could not reject request");
    }
  };

  const handleLeave = async () => {
    Alert.alert("Leave Team", "Are you sure you want to leave?", [
      { text: "Cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await leave();
          Alert.alert("Left", "You left the team");
        },
      },
    ]);
  };

  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Team Requests"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        subtitle="Manage your team and requests"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= MY TEAM SECTION ================= */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>My Team</AppText>

          {!myTeam ? (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>You are not part of any team</AppText>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <AppText style={styles.cardTitle}>{myTeam.storeName}</AppText>
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>Active</AppText>
                </View>
              </View>

              <View style={styles.cardBody}>
                <AppText style={styles.cardLabel}>Owner: <AppText style={styles.cardValue}>{myTeam.ownerName}</AppText></AppText>
                <AppText style={styles.cardLabel}>Team ID: <AppText style={styles.cardValue}>{myTeam.TeamId}</AppText></AppText>
              </View>

              <TouchableOpacity style={styles.leave} onPress={handleLeave}>
                <AppText style={[styles.btnText, { color: theme.colors.error }]}>Leave Team</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ================= PENDING REQUESTS SECTION ================= */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Pending Requests</AppText>

          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No pending requests</AppText>
            </View>
          ) : (
            requests.map((req) => (
              <View key={req.TeamId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <AppText style={styles.cardTitle}>{req.storeName}</AppText>
                  <View style={[styles.badge, styles.requestBadge]}>
                    <AppText style={styles.requestBadgeText}>Request</AppText>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <AppText style={styles.cardLabel}>Owner: <AppText style={styles.cardValue}>{req.ownerName}</AppText></AppText>
                  <AppText style={styles.cardLabel}>Team ID: <AppText style={styles.cardValue}>{req.TeamId}</AppText></AppText>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.reject}
                    onPress={() => handleReject(req.TeamId)}
                  >
                    <AppText style={[styles.btnText, { color: theme.colors.error }]}>Reject</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.accept}
                    onPress={handleAccept}
                  >
                    <AppText style={styles.btnText}>Accept</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 10,
  },
  cardBody: {
    gap: 8,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  cardValue: {
    color: "#333",
    fontWeight: "600",
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F0F0F0", // default
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  requestBadge: {
    backgroundColor: "#FFF4E5", // warm light orange for background
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  requestBadgeText: {
    color: "#FF9500", // solid orange for text
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    backgroundColor: "#fafafa",
  },
  emptyText: {
    fontSize: 15,
    color: "#aaa",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  accept: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    alignItems: 'center',
  },
  reject: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  leave: {
    backgroundColor: "#fff5f5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
