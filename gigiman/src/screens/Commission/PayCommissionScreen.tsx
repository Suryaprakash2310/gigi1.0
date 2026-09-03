import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCommission } from "../../hooks/useCommission";
import { AppText } from "@/components/ui/Text";
import { theme } from "../../theme/theme";
import { injectRazorpayData } from "../../utils/razorpayInjector";
import { razorpayHTML } from "../../utils/razorpayTemplate";
import { RZ_KEY_ID } from "../../utils/constant/razorzay.constant"; // Adjusted path based on RazorPayScreen

type CommissionStackParamList = {
  CommissionHome: undefined;
  PayCommission: undefined;
  CommissionSuccess: undefined;
};

type NavigationProp = NativeStackNavigationProp<CommissionStackParamList, "PayCommission">;

export default function PayCommissionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { recharge, verifyPayment, loading, status } = useCommission();

  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);
  const [currentOrderData, setCurrentOrderData] = useState<{ amount: number; orderId: string } | null>(null);

  const totalUnpaid = status?.totalUnpaid || 0;

  const handlePay = async () => {
    if (totalUnpaid <= 0) {
      Alert.alert("No Dues", "You do not have any pending commission to pay.");
      return;
    }

    try {
      const data = await recharge();
      if (data && data.success && data.order) {
        const html = injectRazorpayData(
          razorpayHTML,
          RZ_KEY_ID,
          data.order.amount,
          data.order.id
        );
        setCurrentOrderData({ amount: data.fullAmountToPay, orderId: data.order.id });
        setRazorpayHtml(html);
      }
    } catch (err) {
      console.error("Recharge init error", err);
      // useCommission hook handles showing error via state or we can just let it fail silently as UI feedback can be next
    }
  };

  const onMessage = async (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (!data.success) {
      Alert.alert("Payment Cancelled");
      setRazorpayHtml(null);
      setCurrentOrderData(null);
      return;
    }

    if (!currentOrderData) return;

    const isVerified = await verifyPayment({
      amount: currentOrderData.amount,
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
    });

    if (isVerified) {
      Alert.alert("Success", "Commission paid successfully");
      navigation.replace("CommissionSuccess");
    } else {
      setRazorpayHtml(null);
      setCurrentOrderData(null);
    }
  };

  if (razorpayHtml) {
    return (
      <View style={styles.webContainer}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: razorpayHtml }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {totalUnpaid <= 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyText}>All Clear ✅{'\n'}No pending commission</AppText>
          </View>
        ) : (
          <>
            <AppText style={styles.label}>This is your total outstanding commission</AppText>
            <View style={styles.summaryCard}>
              <AppText style={styles.amountDisplay}>₹{totalUnpaid}</AppText>
            </View>
            <AppText style={styles.trustText}>Secure payment via Razorpay</AppText>
            
            <TouchableOpacity 
              style={[styles.payButton, loading && styles.payButtonDisabled]} 
              onPress={handlePay}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.payButtonText}>Pay ₹{totalUnpaid}</AppText>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    justifyContent: "center",
  },
  webContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amountDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
  },
  trustText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 26,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
