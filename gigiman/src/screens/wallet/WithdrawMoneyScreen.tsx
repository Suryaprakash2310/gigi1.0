import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { WalletAPI } from "@/api/wallet.api";
import { useWallet } from "@/hooks/useWallet";

export const WithdrawMoneyScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshBalance, refreshTransactions } = useWallet();

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const res = await WalletAPI.withdrawMoney(amt);

      await refreshBalance();
      await refreshTransactions();

      Alert.alert("Success", res.message);
      setAmount("");
    } catch (err: any) {
      console.log("Withdraw error:", err?.response?.data || err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to withdraw money"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppText variant="titleLarge" style={styles.title}>
        Withdraw Money
      </AppText>

      <AppText style={styles.label}>Amount (₹)</AppText>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleWithdraw}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText style={styles.btnText}>Withdraw</AppText>
        )}
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 20,
    fontWeight: "700",
  },
  label: {
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1F1F1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#0D47A1",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
