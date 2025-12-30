import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui/Text";
import { TransactionItem as Tx } from "@/api/wallet.api";

interface Props {
  tx: Tx;
}

export const WalletTransactionItem: React.FC<Props> = ({ tx }) => {
  const isAdd = tx.transactionType === "ADD";

  const dateStr = new Date(tx.createdAt).toLocaleString();

  return (
    <View style={styles.row}>
      <View>
        <AppText style={styles.title}>
          {isAdd ? "Added to Wallet" : "Withdrawn from Wallet"}
        </AppText>
        <AppText style={styles.date}>{dateStr}</AppText>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <AppText style={[styles.amount, isAdd ? styles.add : styles.withdraw]}>
          {isAdd ? "+ " : "- "}₹ {tx.amount.toFixed(2)}
        </AppText>
        <AppText
          style={[
            styles.status,
            tx.transactionStatus === "SUCCESS" ? styles.ok : styles.pending,
          ]}
        >
          {tx.transactionStatus}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  amount: {
    fontWeight: "700",
  },
  add: {
    color: "#2E7D32",
  },
  withdraw: {
    color: "#C62828",
  },
  status: {
    fontSize: 11,
    marginTop: 2,
  },
  ok: {
    color: "#2E7D32",
  },
  pending: {
    color: "#FB8C00",
  },
});
