import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { useTeamRequests } from "@/hooks/useTeamRequest";

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

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <Screen>
      {/* ================= MY TEAM ================= */}
      <AppText variant="titleLarge" style={styles.title}>
        My Team
      </AppText>

      {!myTeam ? (
        <AppText style={{ opacity: 0.6 }}>
          You are not part of any team
        </AppText>
      ) : (
        <View style={styles.card}>
          <AppText variant="bodyLarge" style={styles.name}>
            {myTeam.storeName}
          </AppText>
          <AppText>Owner: {myTeam.ownerName}</AppText>
          <AppText>Team ID: {myTeam.TeamId}</AppText>

          <TouchableOpacity style={styles.leave} onPress={handleLeave}>
            <AppText style={styles.btnText}>Leave Team</AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= PENDING REQUESTS ================= */}
      <AppText variant="titleLarge" style={styles.title}>
        Pending Requests
      </AppText>

      {requests.length === 0 ? (
        <AppText style={{ opacity: 0.6 }}>
          No pending requests
        </AppText>
      ) : (
        requests.map((req) => (
          <View key={req.TeamId} style={styles.card}>
            <AppText variant="bodyLarge" style={styles.name}>
              {req.storeName}
            </AppText>
            <AppText>Owner: {req.ownerName}</AppText>
            <AppText>Team ID: {req.TeamId}</AppText>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.reject}
                onPress={() => handleReject(req.TeamId)}
              >
                <AppText style={styles.btnText}>Reject</AppText>
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { marginBottom: 12, fontWeight: "700", marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontWeight: "600", marginBottom: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  accept: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reject: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  leave: {
    marginTop: 12,
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
