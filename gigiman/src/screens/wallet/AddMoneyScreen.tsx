// import React, { useState } from "react";
// import {
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { Screen } from "@/components/ui/Screen";
// import { AppText } from "@/components/ui/Text";
// import { WalletAPI } from "@/api/wallet.api";
// import { useWallet } from "@/hooks/useWallet";
// import RazorpayCheckout from "react-native-razorpay";

// export const AddMoneyScreen: React.FC = () => {
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { refreshBalance, refreshTransactions } = useWallet();

//   const handleAddMoney = async () => {
//     const amt = Number(amount);
//     if (!amt || amt <= 0) {
//       Alert.alert("Invalid Amount", "Please enter a valid amount");
//       return;
//     }

//     try {
//       setLoading(true);

//       // 1️⃣ Create Razorpay order
//       const order = await WalletAPI.createAddMoneyOrder(amt);

//       const options: any = {
//         description: "Add money to Gigiman wallet",
//         currency: "INR",
//         key: order.key,
//         amount: order.amount * 100, // in paise, if backend sends rupees
//         name: "Gigiman",
//         order_id: order.orderId,
//         theme: { color: "#0D47A1" },
//       };

//       // 2️⃣ Open Razorpay checkout
//       const data = await RazorpayCheckout.open(options);

//       // data contains: razorpay_payment_id, razorpay_order_id, razorpay_signature

//       // 3️⃣ Verify with backend
//       const verifyRes = await WalletAPI.verifyAddMoney({
//         orderId: order.orderId,
//         paymentId: data.razorpay_payment_id,
//         signature: data.razorpay_signature,
//       });

//       await refreshBalance();
//       await refreshTransactions();

//       Alert.alert("Success", verifyRes.message);
//       setAmount("");
//     } catch (err: any) {
//       console.log("Add money error:", err);
//       Alert.alert("Payment Failed", "Payment was not completed or verification failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Screen>
//       <AppText variant="titleLarge" style={styles.title}>
//         Add Money
//       </AppText>

//       <AppText style={styles.label}>Amount (₹)</AppText>
//       <TextInput
//         style={styles.input}
//         keyboardType="numeric"
//         placeholder="Enter amount"
//         value={amount}
//         onChangeText={setAmount}
//       />

//       <TouchableOpacity
//         style={styles.btn}
//         onPress={handleAddMoney}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <AppText style={styles.btnText}>Proceed to Pay</AppText>
//         )}
//       </TouchableOpacity>
//     </Screen>
//   );
// };

// const styles = StyleSheet.create({
//   title: {
//     marginBottom: 20,
//     fontWeight: "700",
//   },
//   label: {
//     marginBottom: 6,
//   },
//   input: {
//     backgroundColor: "#F1F1F1",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   btn: {
//     backgroundColor: "#0D47A1",
//     paddingVertical: 12,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   btnText: {
//     color: "#fff",
//     fontWeight: "700",
//   },
// });





import React, { useState } from "react";
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
import { WebView } from "react-native-webview";

import { razorpayHTML } from "@/utils/razorpayTemplate";
import { injectRazorpayData } from "@/utils/razorpayInjector";

export const AddMoneyScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutHTML, setCheckoutHTML] = useState<string | null>(null);

  const { refreshBalance, refreshTransactions } = useWallet();

  // 🚀 STEP 1: Create Razorpay order
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

      setCheckoutHTML(html); // opens WebView
    } catch (err: any) {
      Alert.alert("Error", "Failed to create order");
      console.log(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 STEP 2: Handle Razorpay WebView Response
  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (!data.success) {
        Alert.alert("Payment Cancelled");
        setCheckoutHTML(null);
        return;
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        data;

      // 🚀 STEP 3: Verify payment with backend
      const verifyRes = await WalletAPI.verifyAddMoney({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      await refreshBalance();
      await refreshTransactions();

      Alert.alert("Success", verifyRes.message);
      setCheckoutHTML(null); // close WebView
      setAmount("");
    } catch (err: any) {
      console.log("Verify error:", err);
      Alert.alert("Verification Failed", "Unable to verify payment.");
      setCheckoutHTML(null);
    }
  };

  // If checkoutHTML is set → show Razorpay WebView
  if (checkoutHTML) {
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html: checkoutHTML }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    );
  }

  // Default Add Money UI
  return (
    <Screen>
      <AppText variant="titleLarge" style={styles.title}>
        Add Money
      </AppText>

      <AppText style={styles.label}>Amount (₹)</AppText>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        placeholder="Enter amount"
        onChangeText={setAmount}
      />

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
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { marginBottom: 20, fontWeight: "700" },
  label: { marginBottom: 6 },
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
