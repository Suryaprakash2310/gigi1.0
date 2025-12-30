import React from "react";
import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { useNavigation } from "@react-navigation/native";
import { useWallet } from "@/hooks/useWallet";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import { WalletTransactionItem } from "@/components/wallet/TransactionItem";

export const WalletHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    balance,
    loadingBalance,
    transactions,
    loadingTx,
    refreshBalance,
    refreshTransactions,
  } = useWallet();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="titleLarge" style={styles.title}>
          Wallet
        </AppText>

        <WalletBalanceCard balance={balance} loading={loadingBalance} />

        {/* Actions */}
        <ScrollView
          horizontal
          style={{ marginTop: 16 }}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AddMoneyScreen")}
          >
            <AppText style={styles.actionText}>Add Money</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.outlineBtn]}
            onPress={() => navigation.navigate("WithdrawMoneyScreen")}
          >
            <AppText style={[styles.actionText, styles.outlineText]}>
              Withdraw
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.outlineBtn]}
            onPress={() => navigation.navigate("TransactionHistoryScreen")}
          >
            <AppText style={[styles.actionText, styles.outlineText]}>
              View All
            </AppText>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent Transactions */}
        <AppText variant="titleMedium" style={styles.sectionTitle}>
          Recent Transactions
        </AppText>

        {loadingTx ? (
          <AppText style={{ opacity: 0.6 }}>Loading...</AppText>
        ) : transactions.length === 0 ? (
          <AppText style={{ opacity: 0.6 }}>No transactions yet</AppText>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <WalletTransactionItem key={tx._id} tx={tx} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#0D47A1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  outlineBtn: {
    backgroundColor: "#E3F2FD",
  },
  outlineText: {
    color: "#0D47A1",
  },
});
