import React from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";

import { useNavigation, useRoute } from "@react-navigation/native";
import { paymentSuccessApi } from "@/api/payment.api";
import { injectRazorpayData } from "@/utils/razorpayInjector";
import { razorpayHTML } from "@/utils/razorpayTemplate";
import { RAZORPAY_KEY_ID } from "@/utils/constant/razorzay.constant";

export default function RazorpayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { bookingId, amount, orderId } = route.params;

  const html = injectRazorpayData(
    razorpayHTML,
    RAZORPAY_KEY_ID,
    amount,
    orderId
  );

  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (!data.success) {
        Alert.alert("Payment Cancelled");
        navigation.goBack();
        return;
      }

      await paymentSuccessApi({
        bookingId,
        paymentMethod: "RAZORPAY",
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });

      Alert.alert("Success", "Payment completed");
      navigation.replace("BookingCompleted", { bookingId });

    } catch (err) {
      Alert.alert("Payment Failed");
      navigation.goBack();
    }
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      onMessage={onMessage}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    />

  );
}
