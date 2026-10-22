import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme/theme";
import { Booking } from "@/api/profile.api";
import { formatBookingId } from "@/utils/booking.utils";

interface BookingDetailModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onRaiseIssue?: (bookingId: string, bookingNumber?: string) => void;
  onOpenActiveJob?: (bookingId: string) => void;
}

const { height: screenHeight } = Dimensions.get("window");

export default function BookingDetailModal({
  visible,
  booking,
  onClose,
  onRaiseIssue,
  onOpenActiveJob,
}: BookingDetailModalProps) {
  if (!booking) return null;

  // Data normalization
  const bookingId = booking._id || "";
  const bookingNumber = (booking as any)?.bookingNumber || formatBookingId(bookingId);
  const status = (booking.status || "PENDING").toUpperCase();
  const statusStyle = getStatusBadgeStyle(status);

  const customerName =
    booking.user?.fullname ||
    (booking as any)?.user?.name ||
    (booking as any)?.userName ||
    (booking as any)?.name ||
    "Customer";

  const customerPhone =
    booking.user?.phoneMasked ||
    (booking as any)?.user?.phone ||
    (booking as any)?.phone ||
    (booking as any)?.phoneNumber ||
    "";

  const address =
    booking.address ||
    (booking as any)?.userAddress ||
    booking.user?.address ||
    (booking as any)?.location ||
    "";

  const serviceName =
    booking.serviceCategoryName ||
    (booking as any)?.serviceName ||
    (booking as any)?.service ||
    "General Service";

  const problemDescription =
    booking.problemDescription ||
    (booking as any)?.description ||
    (booking as any)?.notes ||
    (booking as any)?.note ||
    "";

  const totalPrice = Number(
    booking.totalPrice ??
      (booking as any)?.totalCost ??
      (booking as any)?.cost ??
      (booking as any)?.amount ??
      (booking as any)?.price ??
      0
  );

  const advancePaid = Number(
    booking.advancePayment ??
      (booking as any)?.advancePaid ??
      (booking as any)?.advanceAmount ??
      0
  );

  const rawRemaining =
    booking.remainingAmount ?? (booking as any)?.remainingCost;
  const remainingAmount =
    rawRemaining !== undefined
      ? Number(rawRemaining)
      : Math.max(0, totalPrice - advancePaid);

  const paymentStatus =
    booking.paymentStatus ||
    (booking as any)?.paymentMode ||
    ((booking as any)?.isPaid ? "Paid" : "Pending");

  const isScheduled = booking.isScheduled || !!booking.scheduleDateTime;
  const scheduleDateTime = booking.scheduleDateTime || (booking as any)?.serviceTime;
  const createdAt = booking.createdAt;

  const employeeCount =
    booking.employeeCount ||
    (booking as any)?.requiredEmployees ||
    (booking as any)?.numberOfEmployees;

  const duration =
    booking.durationInMinutes ||
    (booking as any)?.duration ||
    (booking as any)?.workingHours;

  const primaryEmployee =
    booking.primaryEmployee?.fullname || (booking as any)?.employeeName;

  const servicerCompany =
    booking.servicerCompany?.storeName || (booking as any)?.companyName;

  const toolshopLocation =
    booking.selectedToolshop?.storeLocation || (booking as any)?.toolshopName;

  const items = (booking.items || (booking as any)?.parts || []) as Array<any>;

  const isActiveJob = ["ACCEPTED", "ONGOING", "PENDING"].includes(status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.modalTitle}>Booking Details</Text>
                {bookingNumber ? (
                  <View style={styles.idChip}>
                    <Ionicons name="receipt-outline" size={12} color="#555" />
                    <Text style={styles.idText}>{bookingNumber}</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusStyle.dot },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: statusStyle.text },
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. SERVICE OVERVIEW CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
                  <Ionicons name="construct" size={18} color="#E65100" />
                </View>
                <Text style={styles.cardTitle}>Service Information</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Category / Service</Text>
                <Text style={styles.valueHighlight}>{serviceName}</Text>
              </View>

              {isScheduled && scheduleDateTime ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Scheduled For</Text>
                  <View style={styles.datetimeBadge}>
                    <Ionicons name="calendar-outline" size={13} color="#1565C0" />
                    <Text style={styles.datetimeText}>
                      {formatDate(scheduleDateTime)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {createdAt ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Booked On</Text>
                  <Text style={styles.value}>{formatDate(createdAt)}</Text>
                </View>
              ) : null}

              {duration ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Est. Duration</Text>
                  <Text style={styles.value}>
                    {duration} {typeof duration === "number" ? "mins" : ""}
                  </Text>
                </View>
              ) : null}

              {employeeCount ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Technicians Required</Text>
                  <Text style={styles.value}>{employeeCount}</Text>
                </View>
              ) : null}

              {problemDescription ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Customer Note / Issue:</Text>
                  <Text style={styles.noteText}>{problemDescription}</Text>
                </View>
              ) : null}
            </View>

            {/* 2. CUSTOMER & LOCATION CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                  <Ionicons name="person" size={18} color="#1565C0" />
                </View>
                <Text style={styles.cardTitle}>Customer & Location</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Customer Name</Text>
                <Text style={styles.valueBold}>{customerName}</Text>
              </View>

              {customerPhone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Phone Number</Text>
                  <Text style={styles.value}>{customerPhone}</Text>
                </View>
              ) : null}

              {address ? (
                <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                  <Text style={[styles.label, { marginTop: 2 }]}>Address</Text>
                  <View style={styles.addressWrapper}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#D32F2F"
                      style={{ marginTop: 2, marginRight: 4 }}
                    />
                    <Text style={styles.addressText}>{address}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* 3. PAYMENT & BILLING SUMMARY */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="cash" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.cardTitle}>Billing & Payment</Text>
              </View>

              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Total Service Price</Text>
                <Text style={styles.billingMainValue}>
                  ₹{totalPrice.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Advance Paid</Text>
                <Text style={styles.value}>
                  ₹{advancePaid.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Balance / Remaining</Text>
                <Text
                  style={[
                    styles.valueBold,
                    { color: remainingAmount > 0 ? "#E65100" : "#2E7D32" },
                  ]}
                >
                  ₹{remainingAmount.toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Payment Status</Text>
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
                      styles.paymentChipText,
                      {
                        color:
                          String(paymentStatus).toLowerCase() === "paid"
                            ? "#2E7D32"
                            : "#EF6C00",
                      },
                    ]}
                  >
                    {paymentStatus}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. ASSIGNMENT & TEAM DETAILS (IF ANY) */}
            {(primaryEmployee || servicerCompany || toolshopLocation) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#F3E5F5" }]}
                  >
                    <Ionicons name="people" size={18} color="#7B1FA2" />
                  </View>
                  <Text style={styles.cardTitle}>Service Team & Sourcing</Text>
                </View>

                {primaryEmployee && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Assigned Provider</Text>
                    <Text style={styles.valueBold}>{primaryEmployee}</Text>
                  </View>
                )}

                {servicerCompany && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Company / Team</Text>
                    <Text style={styles.value}>{servicerCompany}</Text>
                  </View>
                )}

                {toolshopLocation && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Tool Shop Location</Text>
                    <Text style={styles.value}>{toolshopLocation}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 5. PARTS / ITEMS LIST (IF ANY) */}
            {items && items.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#E0F2F1" }]}
                  >
                    <Ionicons name="cube" size={18} color="#00796B" />
                  </View>
                  <Text style={styles.cardTitle}>Parts & Extra Items</Text>
                </View>

                {items.map((item: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>
                        {item.name || item.partName || `Item #${idx + 1}`}
                      </Text>
                      <Text style={styles.itemQty}>
                        Qty: {item.quantity || item.qty || 1}
                      </Text>
                    </View>
                    {item.price ? (
                      <Text style={styles.itemPrice}>
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.footer}>
            {isActiveJob && onOpenActiveJob && (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  onClose();
                  onOpenActiveJob(bookingId);
                }}
              >
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={styles.primaryActionText}>Go to Live Job</Text>
              </TouchableOpacity>
            )}

            {onRaiseIssue && (
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  !isActiveJob && { flex: 1 },
                ]}
                onPress={() => {
                  onClose();
                  onRaiseIssue(bookingId, bookingNumber);
                }}
              >
                <Ionicons
                  name="help-buoy-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.secondaryActionText}>Raise Issue</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.closeOutlineBtn,
                (!onRaiseIssue || !isActiveJob) && { flex: 1 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "COMPLETED":
      return { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" };
    case "PENDING":
      return { bg: "#FFF3E0", text: "#E65100", dot: "#FF9800" };
    case "ACCEPTED":
      return { bg: "#E3F2FD", text: "#1565C0", dot: "#2196F3" };
    case "ONGOING":
      return { bg: "#E1F5FE", text: "#0277BD", dot: "#03A9F4" };
    case "CANCELLED":
    case "REJECTED":
      return { bg: "#FFEBEE", text: "#C62828", dot: "#F44336" };
    default:
      return { bg: "#F5F5F5", text: "#616161", dot: "#9E9E9E" };
  }
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.88,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#DDD",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  idChip: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#ECEFF1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idText: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
    marginLeft: 4,
  },
  copiedFeedback: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: "700",
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F4",
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
  },
  value: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 10,
  },
  valueBold: {
    fontSize: 13,
    color: "#222",
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 10,
  },
  valueHighlight: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 10,
  },
  datetimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  datetimeText: {
    fontSize: 12,
    color: "#1565C0",
    fontWeight: "600",
    marginLeft: 4,
  },
  addressWrapper: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-end",
    marginLeft: 16,
  },
  addressText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFA000",
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F57C00",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  noteText: {
    fontSize: 12,
    color: "#5D4037",
    lineHeight: 16,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  billingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  billingMainValue: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 6,
  },
  paymentChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  itemQty: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryActionText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryActionText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  closeOutlineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  closeOutlineText: {
    color: "#555",
    fontWeight: "700",
    fontSize: 13,
  },
});
