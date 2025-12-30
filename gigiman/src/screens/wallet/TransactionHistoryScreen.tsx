import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { useWallet } from "@/hooks/useWallet";
import { WalletTransactionItem } from "@/components/wallet/TransactionItem";

export const TransactionHistoryScreen: React.FC = () => {
  const { transactions, loadingTx, refreshTransactions } = useWallet();

  return (
    <Screen>
      <AppText variant="titleLarge" style={styles.title}>
        Transactions
      </AppText>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingTx ? (
          <AppText style={{ opacity: 0.6 }}>Loading...</AppText>
        ) : transactions.length === 0 ? (
          <AppText style={{ opacity: 0.6 }}>No transactions found</AppText>
        ) : (
          transactions.map((tx) => (
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
});
