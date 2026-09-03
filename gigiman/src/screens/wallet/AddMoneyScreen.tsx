import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/Text";
import { WalletAPI } from "@/api/wallet.api";
import { useWallet } from "@/hooks/useWallet";
import { WebView } from "react-native-webview";

import { razorpayHTML } from "@/utils/razorpayTemplate";
import { injectRazorpayData } from "@/utils/razorpayInjector";

const QUICK_AMOUNTS = [500, 1000, 2000];

export const AddMoneyScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutHTML, setCheckoutHTML] = useState<string | null>(null);

  const { refreshBalance, refreshTransactions } = useWallet();

  const handleProceed = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const order = await WalletAPI.createAddMoneyOrder(amt);

      const html = injectRazorpayData(
        razorpayHTML,
        order.key,
        order.amount,
        order.orderId
      );

      setCheckoutHTML(html);
    } catch (err) {
      Alert.alert("Error", "Unable to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (!data.success) {
        setCheckoutHTML(null);
        return;
      }

      await WalletAPI.verifyAddMoney({
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        signature: data.razorpay_signature,
      });

      await refreshBalance();
      await refreshTransactions();

      Alert.alert("Success", "Money added to wallet");
      setAmount("");
    } catch {
      Alert.alert("Payment Failed", "Verification failed");
    } finally {
      setCheckoutHTML(null);
    }
  };

  if (checkoutHTML) {
    return (
      <WebView
        source={{ html: checkoutHTML }}
        onMessage={onMessage}
        javaScriptEnabled
      />
    );
  }

  return (
    <Screen>
      <AppHeader title="Add Money" />

      <AppText variant="titleLarge" style={styles.title}>
        Add Money
      </AppText>

      <AppText style={styles.subtitle}>
        Add money to your wallet securely
      </AppText>

      {/* Amount Input */}
      <AppText style={styles.label}>Enter Amount (₹)</AppText>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="e.g. 1000"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Quick Amounts */}
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={styles.quickBtn}
            onPress={() => setAmount(String(amt))}
          >
            <AppText style={styles.quickText}>₹ {amt}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.btn}
        disabled={loading}
        onPress={handleProceed}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText style={styles.btnText}>Proceed to Pay</AppText>
        )}
      </TouchableOpacity>

      {/* Trust */}
      <AppText style={styles.trust}>
        Secure payments powered by Razorpay
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
  quickRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 24,
  },
  quickBtn: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
  },
  quickText: {
    color: theme.colors.primary,
    fontWeight: "600",
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
  trust: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginTop: 14,
  },
});
