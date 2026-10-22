import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme/theme";
import { Booking } from "@/api/profile.api";
import { formatBookingId } from "@/utils/booking.utils";

interface Props {
  booking: Booking;
  onPress?: () => void;
}

export default function RecentBookingCard({ booking, onPress }: Props) {
  const status = (booking.status || "PENDING").toUpperCase();
  const statusColor = getStatusColor(status);

  const customerName =
    booking.user?.fullname ||
    (booking as any)?.user?.name ||
    (booking as any)?.userName ||
    (booking as any)?.name ||
    "Customer";

  const serviceName =
    booking.serviceCategoryName ||
    (booking as any)?.service ||
    (booking as any)?.serviceName ||
    "General Service";

  const total = Number(
    booking.totalPrice ??
      (booking as any)?.totalCost ??
      (booking as any)?.cost ??
      (booking as any)?.amount ??
      (booking as any)?.price ??
      0
  );

  const bookingId = booking.bookingCode || (booking._id ? formatBookingId(booking._id) : "");

  const address =
    booking.address ||
    (booking as any)?.userAddress ||
    booking.user?.address ||
    (booking as any)?.location ||
    "";

  const isScheduled = booking.isScheduled || !!booking.scheduleDateTime;
  const rawDate = isScheduled
    ? booking.scheduleDateTime || (booking as any)?.serviceTime || booking.createdAt
    : booking.createdAt;

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "-";

  const paymentStatus =
    booking.paymentStatus ||
    (booking as any)?.paymentMode ||
    ((booking as any)?.isPaid ? "Paid" : null);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: Service Category & Price */}
      <View style={styles.topRow}>
        <View style={styles.serviceBadge}>
          <Ionicons
            name="construct-outline"
            size={13}
            color={theme.colors.primary}
            style={{ marginRight: 4 }}
          />
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.serviceText} numberOfLines={1}>
              {serviceName}
            </Text>
            {bookingId ? (
              <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.colors.primary, marginTop: 1 }}>
                #{bookingId}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.amountChip}>
          <Text style={styles.amountText}>₹{total.toLocaleString("en-IN")}</Text>
        </View>
      </View>

      {/* Middle Row: Customer Name & ID */}
      <View style={styles.middleRow}>
        <View style={styles.customerInfo}>
          <View style={styles.avatarMini}>
            <Ionicons name="person" size={14} color="#555" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>
            <View style={styles.dateTimeRow}>
              <Ionicons
                name={isScheduled ? "calendar-outline" : "time-outline"}
                size={12}
                color="#777"
              />
              <Text style={styles.dateTimeText} numberOfLines={1}>
                {formattedDate}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Address Snippet (if available) */}
      {address ? (
        <View style={styles.addressRow}>
          <Ionicons
            name="location-outline"
            size={12}
            color="#888"
            style={{ marginTop: 1, marginRight: 4 }}
          />
          <Text style={styles.addressText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardDivider} />

      {/* Bottom Row: Status Badge, Payment Tag & View Details CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.statusChip, { backgroundColor: statusColor.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {status}
            </Text>
          </View>

          {paymentStatus ? (
            <View
              style={[
                styles.paymentChip,
                {
                  backgroundColor:
                    String(paymentStatus).toLowerCase() === "paid"
                      ? "#E8F5E9"
                      : "#FFF3E0",
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentText,
                  {
                    color:
                      String(paymentStatus).toLowerCase() === "paid"
                        ? "#2E7D32"
                        : "#E65100",
                  },
                ]}
              >
                {paymentStatus}
              </Text>
            </View>
          ) : null}
        </View>

        {onPress && (
          <View style={styles.detailsCta}>
            <Text style={styles.detailsCtaText}>Details</Text>
            <Ionicons name="chevron-forward" size={13} color={theme.colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getStatusColor(status?: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "COMPLETED":
      return { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" };
    case "PENDING":
      return { bg: "#FFF3E0", text: "#EF6C00", dot: "#FF9800" };
    case "ACCEPTED":
      return { bg: "#E3F2FD", text: "#1565C0", dot: "#2196F3" };
    case "ONGOING":
      return { bg: "#E1F5FE", text: "#0288D1", dot: "#03A9F4" };
    case "CANCELLED":
    case "REJECTED":
      return { bg: "#FFEBEE", text: "#C62828", dot: "#F44336" };
    default:
      return { bg: "#F5F5F5", text: "#616161", dot: "#9E9E9E" };
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: "68%",
  },

  serviceText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  amountChip: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  amountText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2E7D32",
  },

  middleRow: {
    marginBottom: 8,
  },

  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    maxWidth: "70%",
  },

  idChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },

  dateTimeText: {
    fontSize: 11,
    color: "#777",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 2,
  },

  addressText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginVertical: 8,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  paymentChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  paymentText: {
    fontSize: 11,
    fontWeight: "600",
  },

  detailsCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  detailsCtaText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
});
