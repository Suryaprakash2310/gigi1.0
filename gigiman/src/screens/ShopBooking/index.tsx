import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { socket } from "@/socket/socket";
import { theme } from "@/theme/theme";

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
      <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>No Request ID Provided</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>Enter Pickup OTP</Text>

      <TextInput
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter 4-digit OTP"
        placeholderTextColor={theme.colors.textMuted}
        style={{
          borderWidth: 1.2,
          borderColor: theme.colors.border,
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          padding: 14,
          fontSize: 16,
          marginVertical: 12,
        }}
      />

      <TouchableOpacity
        onPress={verifyOtp}
        style={{
          backgroundColor: theme.colors.button || theme.colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
};
