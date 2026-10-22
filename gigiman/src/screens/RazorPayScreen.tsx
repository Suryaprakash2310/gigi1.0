import React from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";

import { useNavigation, useRoute } from "@react-navigation/native";
import { paymentSuccessApi } from "@/api/payment.api";
import { injectRazorpayData } from "@/utils/razorpayInjector";
import { razorpayHTML } from "@/utils/razorpayTemplate";
import { RZ_KEY_ID } from "@/utils/constant/razorzay.constant";
import { useProviderBooking } from "@/context/ProviderBookingContext";

export default function RazorpayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { resetBookingState } = useProviderBooking();

  const { bookingId, amount, orderId } = route.params;


  const html = injectRazorpayData(
    razorpayHTML,
    RZ_KEY_ID,
    amount,
    orderId
  );


  const onMessage = async (event: any) => {
  const data = JSON.parse(event.nativeEvent.data);

  if (!data.success) {
    Alert.alert("Payment Cancelled");
    navigation.goBack();
    return;
  }

  try {
    await paymentSuccessApi({
      bookingId,
      paymentMethod: "RAZORPAY",
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
    });

    Alert.alert("Success", "Payment completed");
    resetBookingState?.();
    navigation.replace("BookingCompleted", { bookingId });
  } catch (err: any) {
    Alert.alert("Payment Verification Error", err?.response?.data?.message || "Failed to confirm payment");
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
