import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";

interface RequestCardProps {
  request: any;
  onAccept?: () => void;
  onReject?: () => void;
  onVerify?: () => void;
  onDownloadBill?: () => void;
  mode: "incoming" | "pickup";
}

export const RequestCard = ({
  request,
  onAccept,
  onReject,
  onVerify,
  onDownloadBill,
  mode,
}: RequestCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Ionicons name="cube-outline" size={14} color="#0D9488" />
          <Text style={styles.title}>Parts Request</Text>
        </View>
        <Text style={styles.total}>₹{request.totalCost}</Text>
      </View>

      <View style={styles.partsList}>
        {request.parts?.map((p: any, i: number) => (
          <View key={i} style={styles.partItem}>
            <Text style={styles.partName} numberOfLines={1}>
              {p.partName}
            </Text>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>× {p.quantity}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 🔽 ACTIONS */}
      {mode === "incoming" && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onReject}
            style={styles.reject}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAccept}
            style={styles.accept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "pickup" && (
        <View style={styles.pickupActions}>
          <TouchableOpacity
            onPress={onVerify}
            style={styles.verify}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Verify OTP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDownloadBill}
            style={styles.download}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Download Bill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
    letterSpacing: 0.2,
  },
  total: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  partsList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  partItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  accept: {
    flex: 1.25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#16A34A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  reject: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },
  rejectText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  pickupActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  verify: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  download: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
});
