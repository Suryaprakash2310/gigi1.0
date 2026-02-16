import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../theme/theme";

interface RequestCardProps {
  request: any;
  onAccept?: () => void;
  onReject?: () => void;
  onVerify?: () => void;
  onTrack?: () => void;
  mode: "incoming" | "pickup";
}


export const RequestCard = ({
  request,
  onAccept,
  onReject,
  onVerify,
  onTrack,
  mode,
}: RequestCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Parts Request</Text>

      {request.parts.map((p: any, i: number) => (
        <Text key={i}>
          {p.partName} × {p.quantity}
        </Text>
      ))}

      <Text style={styles.total}>₹{request.totalCost}</Text>

      {/* 🔽 ACTIONS */}
      {mode === "incoming" && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onReject} style={styles.reject}>
            <Text>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onAccept} style={styles.accept}>
            <Text>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "pickup" && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity onPress={onVerify} style={[styles.verify, { flex: 1 }]}>
            <Text style={{ color: "#fff", textAlign: 'center' }}>Verify OTP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onTrack} style={[styles.track, { flex: 1 }]}>
            <Text style={{ color: "#fff", textAlign: 'center' }}>Track Live</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontWeight: "700", marginBottom: 8 },
  actions: { flexDirection: "row", marginTop: 12 },
  accept: {
    flex: 1,
    backgroundColor: "green",
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  reject: {
    flex: 1,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  btnText: { color: "#fff", textAlign: "center" },
  total: { fontWeight: "700", marginTop: 8 },
  verify: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  track: {
    backgroundColor: "#2196F3", // Blue for tracking
    padding: 10,
    borderRadius: 8,
  },
});
