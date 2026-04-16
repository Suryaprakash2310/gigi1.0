import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText } from "@/components/ui/Text";
import { theme } from "../../theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCommission } from "../../hooks/useCommission";
import { ActivityIndicator } from "react-native";

type CommissionStackParamList = {
  CommissionHome: undefined;
  PayCommission: undefined;
  CommissionSuccess: undefined;
};

type NavigationProp = NativeStackNavigationProp<CommissionStackParamList, "CommissionSuccess">;

export default function CommissionSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { status, loading } = useCommission();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
        <AppText style={styles.title}>Payment Successful!</AppText>
        <AppText style={styles.message}>
          Your commission has been successfully paid and your account is updated.
        </AppText>

        <View style={styles.amountContainer}>
          <AppText style={styles.amountLabel}>Updated Unpaid Commission</AppText>
          {loading && !status ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <AppText style={styles.amountValue}>₹ {status?.unpaidCommission?.toFixed(2) || "0.00"}</AppText>
          )}
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate("CommissionHome")}
        >
          <AppText style={styles.buttonText}>Go to Commission Home</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  amountContainer: {
    backgroundColor: "#fafafa",
    width: "100%",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amountLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
