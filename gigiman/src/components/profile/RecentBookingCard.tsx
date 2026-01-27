import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme/theme";
import { Booking } from "@/api/profile.api";

interface Props {
  booking: Booking;
}

export default function RecentBookingCard({ booking }: Props) {
  const statusColor = getStatusColor(booking.status);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.customer}>
            {booking.user?.fullname || "Customer"}
          </Text>
          <Text style={styles.service}>
            {booking.serviceCategoryName || "Service"}
          </Text>
        </View>

        <Text style={styles.amount}>₹{booking.totalPrice ?? 0}</Text>
      </View>

      {/* Footer */}
      <View style={styles.bottomRow}>
        <View style={[styles.statusChip, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {booking.status}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color="#888" />
          <Text style={styles.date}>
            {new Date(booking.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getStatusColor(status?: string) {
  switch (status) {
    case "COMPLETED":
      return { bg: "#E6F7EC", text: "#1E7F4F" };
    case "CANCELLED":
      return { bg: "#FDECEA", text: "#D93025" };
    case "ONGOING":
      return { bg: "#FFF4E5", text: "#E37400" };
    default:
      return { bg: "#EEE", text: "#555" };
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  customer: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },

  service: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  date: {
    fontSize: 11,
    color: "#888",
    marginLeft: 4,
  },
});
