import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { useWallet } from "@/hooks/useWallet";
import { WalletTransactionItem } from "@/components/wallet/TransactionItem";

export const TransactionHistoryScreen: React.FC = () => {
  const { transactions, loadingTx } = useWallet();

  return (
    <Screen>
      <AppHeader title="Transactions" />
      <AppText variant="titleLarge" style={styles.title}>
        Transactions
      </AppText>

      {loadingTx ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>
            No transactions found
          </AppText>
          <AppText style={styles.emptySub}>
            Wallet activity will show up here
          </AppText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {transactions.map((tx) => (
            <WalletTransactionItem key={tx._id} tx={tx} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
    fontWeight: "700",
  },
  loader: {
    paddingVertical: 40,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontWeight: "600",
    opacity: 0.7,
  },
  emptySub: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 6,
  },
});
