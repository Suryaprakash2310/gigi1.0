import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/ui/Text";
import { TransactionItem as Tx } from "@/api/wallet.api";

interface Props {
  tx: Tx;
}

export const WalletTransactionItem: React.FC<Props> = ({ tx }) => {
  const isCredit = tx.transactionType === "ADD" || tx.transactionType === "REFUND";
  const isHold = tx.transactionType === "HOLD";

  const dateStr = new Date(tx.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const titleMap: Record<string, string> = {
    ADD: "Added to Wallet",
    WITHDRAW: "Withdrawn",
    HOLD: "Amount on Hold",
    REFUND: "Refund Received",
  };

  return (
    <View style={styles.row}>
      {/* Left */}
      <View style={styles.left}>
        <AppText style={styles.title}>
          {titleMap[tx.transactionType] || "Wallet Transaction"}
        </AppText>
        <AppText style={styles.date}>{dateStr}</AppText>
      </View>

      {/* Right */}
      <View style={styles.right}>
        <AppText
          style={[
            styles.amount,
            isHold
              ? styles.hold
              : isCredit
              ? styles.credit
              : styles.debit,
          ]}
        >
          {isCredit ? "+ " : isHold ? "" : "- "}₹ {tx.amount.toFixed(2)}
        </AppText>

        <View
          style={[
            styles.statusChip,
            tx.transactionStatus === "SUCCESS"
              ? styles.success
              : tx.transactionStatus === "FAILED"
              ? styles.failed
              : styles.pending,
          ]}
        >
          <AppText style={styles.statusText}>
            {tx.transactionStatus}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: "flex-end",
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  amount: {
    fontWeight: "700",
    fontSize: 14,
  },
  credit: {
    color: "#2E7D32",
  },
  debit: {
    color: "#C62828",
  },
  hold: {
    color: "#FB8C00",
  },
  statusChip: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  success: {
    backgroundColor: "#2E7D32",
  },
  pending: {
    backgroundColor: "#FB8C00",
  },
  failed: {
    backgroundColor: "#C62828",
  },
});
