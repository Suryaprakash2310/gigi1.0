import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { socket } from "@/socket/socket";

export const ToolShopBooking = ({ route }: any) => {
  const requestId = route?.params?.requestId;
  const [otp, setOtp] = useState("");

// Client-side: emit verification request to server; server should handle DB logic and respond
// with 'toolshop-otp-success' or 'toolshop-otp-failed' events which this client can listen to.

  useEffect(() => {
    socket.on("part-otp-success", () => {
      Alert.alert("Success", "Parts handed over successfully");
    });

    socket.on("otp-failed", (err) => {
      Alert.alert("Invalid OTP", err?.message || "Try again");
    });

    return () => {
      socket.off("part-otp-success");
      socket.off("otp-failed");
    };
  }, []);

  const verifyOtp = () => {
    socket.emit("verify-part-otp", {
      requestId,
      otp,
    });
  };

  if (!requestId) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No Request ID Provided</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>Enter Pickup OTP</Text>

      <TextInput
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
        style={{ borderWidth: 1, padding: 10, marginVertical: 12 }}
      />

      <TouchableOpacity onPress={verifyOtp}>
        <Text style={{ color: "blue" }}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
};
