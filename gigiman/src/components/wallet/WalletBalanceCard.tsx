import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";

interface Props {
  balance: number | null;
  loading?: boolean;
}

export const WalletBalanceCard: React.FC<Props> = ({ balance, loading }) => {
  return (
    <Card style={styles.card}>
      <AppText style={styles.label}>Wallet Balance</AppText>
      <AppText style={styles.amount}>
        {loading ? "₹ …" : `₹ ${balance?.toFixed(2) || "0.00"}`}
      </AppText>
      <AppText style={styles.sub}>Securely powered by Razorpay</AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0D47A1",
    padding: 18,
    borderRadius: 16,
  },
  label: {
    color: "#BBDEFB",
    fontSize: 14,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 6,
  },
  sub: {
    color: "#BBDEFB",
    fontSize: 12,
    marginTop: 8,
  },
});
