import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AppText } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  balance: number | null;
  loading?: boolean;
  holdAmount?: number; // future-ready
}

export const WalletBalanceCard: React.FC<Props> = ({
  balance,
  loading,
  holdAmount = 0,
}) => {
  const [hide, setHide] = useState(false);

  const displayBalance = loading
    ? "₹ …"
    : hide
    ? "₹ ****"
    : `₹ ${balance?.toFixed(2) || "0.00"}`;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.label}>Available Balance</AppText>
        <TouchableOpacity onPress={() => setHide(!hide)}>
          <Ionicons
            name={hide ? "eye-off-outline" : "eye-outline"}
            size={18}
            color="#E3F2FD"
          />
        </TouchableOpacity>
      </View>

      {/* Balance */}
      <AppText style={styles.amount}>{displayBalance}</AppText>

      {/* Hold info */}
      {holdAmount > 0 && (
        <AppText style={styles.hold}>
          ₹ {holdAmount.toFixed(2)} on hold
        </AppText>
      )}

      {/* Trust footer */}
      <AppText style={styles.sub}>Secure payments powered by Razorpay</AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0D47A1",
    padding: 20,
    borderRadius: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#BBDEFB",
    fontSize: 14,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
  },
  hold: {
    color: "#FFE082",
    fontSize: 13,
    marginTop: 6,
  },
  sub: {
    color: "#BBDEFB",
    fontSize: 12,
    marginTop: 12,
  },
});
