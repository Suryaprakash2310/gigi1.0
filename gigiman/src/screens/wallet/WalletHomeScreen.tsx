import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  ActivityIndicator,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

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
  } = useWallet();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <AppHeader title="Wallet" />

        {/* Balance Card */}
        <WalletBalanceCard
          balance={balance}
          loading={loadingBalance}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("AddMoneyScreen")}
          >
            <AppText style={styles.primaryText}>Add Money</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("WithdrawMoneyScreen")}
          >
            <AppText style={styles.secondaryText}>Withdraw</AppText>
          </TouchableOpacity>
        </View>

        {/* Transactions header */}
        <View style={styles.txHeader}>
          <AppText variant="titleMedium" style={styles.sectionTitle}>
            Recent Transactions
          </AppText>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TransactionHistoryScreen")
            }
          >
            <AppText style={styles.viewAll}>View all</AppText>
          </TouchableOpacity>
        </View>

        {/* Transactions list */}
        {loadingTx ? (
          <View style={styles.loader}>
            <ActivityIndicator />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.empty}>
            <AppText style={styles.emptyText}>
              No transactions yet
            </AppText>
            <AppText style={styles.emptySub}>
              Your wallet activity will appear here
            </AppText>
          </View>
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
  container: {
    paddingBottom: 40,
  },
  title: {
    marginBottom: 16,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 28,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
  },
  primaryText: {
    color: theme.colors.background,
    fontWeight: "600",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  viewAll: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    paddingVertical: 20,
  },
  empty: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyText: {
    fontWeight: "600",
    opacity: 0.7,
  },
  emptySub: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
});
