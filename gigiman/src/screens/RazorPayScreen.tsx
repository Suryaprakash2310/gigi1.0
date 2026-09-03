import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";

import { useNavigation, useRoute } from "@react-navigation/native";
import { paymentSuccessApi } from "@/api/payment.api";
import { injectRazorpayData } from "@/utils/razorpayInjector";
import { razorpayHTML } from "@/utils/razorpayTemplate";
import { RZ_KEY_ID } from "@/utils/constant/razorzay.constant";
import Constants from "expo-constants";

export default function RazorpayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { bookingId, amount, orderId } = route.params;
  console.log("🧪 Razorpay inputs:", {
  RZ_KEY_ID,
  bookingId,
  amount,
  orderId,
});


  const html = injectRazorpayData(
    razorpayHTML,
    RZ_KEY_ID,
    amount,
    orderId
  );
  useEffect(() => {
    console.log("Razorpay HTML:", html);
    console.log("🔍 FULL CONSTANTS:", Constants);
console.log("🔍 expoConfig.extra:", Constants.expoConfig?.extra);
  }, []);

  const onMessage = async (event: any) => {
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
