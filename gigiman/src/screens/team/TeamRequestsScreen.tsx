import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { useTeamRequests } from "@/hooks/useTeamRequest";

export const TeamRequestsScreen = () => {
  const { requests, loading, accept, reject } = useTeamRequests();

  const handleAccept = async () => {
    try {
      const res = await accept();
      const message = (res as any)?.message || "Request Accepted";
      Alert.alert("Success", message);
    } catch (err) {
      Alert.alert("Error", "Could not accept request");
    }
  };

  const handleReject = async (teamId: string) => {
    try {
      const res = await reject(teamId);
      const message = (res as any)?.message || "Request Rejected";
      Alert.alert("Rejected", message);
    } catch (err) {
      Alert.alert("Error", "Could not reject request");
    }
  };

  return (
    <Screen>
      <AppText variant="titleLarge" style={styles.title}>
        Team Requests
      </AppText>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : requests.length === 0 ? (
        <AppText style={{ opacity: 0.6 }}>No pending requests</AppText>
      ) : (
        requests.map((req) => (
          <View key={req.TeamId} style={styles.card}>
            <AppText variant="bodyLarge" style={styles.name}>
              {req.storeName}
            </AppText>
            <AppText variant="caption">Owner: {req.ownerName}</AppText>
            <AppText variant="caption">Team: {req.TeamId}</AppText>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.reject}
                onPress={() => handleReject(req.TeamId)}
              >
                <AppText style={styles.btnText}>Reject</AppText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accept} onPress={handleAccept}>
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
  title: { marginBottom: 16, fontWeight: "700" },
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
  btnText: { color: "#fff", fontWeight: "600" },
});
