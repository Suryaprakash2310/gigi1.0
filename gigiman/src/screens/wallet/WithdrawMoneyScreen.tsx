import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";

import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { WalletAPI } from "@/api/wallet.api";
import { useWallet } from "@/hooks/useWallet";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

const MIN_WITHDRAW = 500;

export const WithdrawMoneyScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshBalance, refreshTransactions,kycStatus, balance } = useWallet();
  const navigation = useNavigation<any>();
  

  const handleWithdraw = async () => {
    const amt = Number(amount);

    if (!amt || amt < MIN_WITHDRAW) {
      Alert.alert(
        "Invalid Amount",
        `Minimum withdrawal is ₹${MIN_WITHDRAW}`
      );
      return;
    }

    if (balance !== null && amt > balance) {
      Alert.alert("Insufficient Balance");
      return;
    }

    try {
      setLoading(true);
      const res = await WalletAPI.withdrawMoney(amt);

      await refreshBalance();
      await refreshTransactions();

      Alert.alert("Success", res.message, [
  {
    text: "OK",
    onPress: () => navigation.replace("WithdrawStatusScreen"),
  },
]);
      setAmount("");
    } catch (err: any) {
      Alert.alert(
        "Withdrawal Failed",
        err?.response?.data?.message || "Please try again later"
      );
    } finally {
      setLoading(false);
    }
  };
  if (kycStatus !== "VERIFIED") {
  return (
    <Screen>
      <AppText variant="titleLarge">Withdraw Money</AppText>

      <View style={styles.blockBox}>
        <AppText style={styles.blockText}>
          Complete KYC to withdraw money
        </AppText>
      </View>
    </Screen>
  );
}


  return (
    <Screen>
      <AppHeader title="Withdraw Money" showBack onBackPress={() => navigation.goBack()} />

      <AppText variant="titleLarge" style={styles.title}>
        Withdraw Money
      </AppText>

      <AppText style={styles.subtitle}>
        Withdraw funds to your registered bank account
      </AppText>

      {/* Amount */}
      <AppText style={styles.label}>Enter Amount (₹)</AppText>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Rules */}
      <View style={styles.rulesBox}>
        <AppText style={styles.rule}>• Minimum withdraw ₹500</AppText>
        <AppText style={styles.rule}>
          • Amount will be credited within 24 hours
        </AppText>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.btn}
        disabled={loading}
        onPress={handleWithdraw}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText style={styles.btnText}>Withdraw</AppText>
        )}
      </TouchableOpacity>

      <AppText style={styles.note}>
        Withdrawals are processed to your verified bank account
      </AppText>
      
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 24,
  },
  label: {
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  rulesBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 24,
  },
  rule: {
    fontSize: 12,
    opacity: 0.8,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: theme.colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 14,
    textAlign: "center",
  },
  blockBox: {
  backgroundColor: "#FFF8E1",
  borderRadius: 12,
  padding: 16,
  marginTop: 20,
},
blockText: {
  fontSize: 14,
  fontWeight: "600",
},

});
