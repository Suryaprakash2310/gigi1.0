import React from "react";
import { View, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import { AppText } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

export const WithdrawStatusScreen: React.FC = () => {
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.safe}>
      <AppHeader title="Withdraw Status" showBack />
      <View style={[styles.container, { paddingHorizontal: Math.min(24, width * 0.06) }] }>
        <Ionicons
          name="time-outline"
          size={64}
          color={theme.colors.secondary}
        />

        <AppText style={styles.title}>
          Withdrawal Processing
        </AppText>

        <AppText style={styles.sub}>
          Your withdrawal request has been submitted successfully.
        </AppText>

        <View style={styles.box}>
          <AppText style={styles.info}>
            • Amount will be credited within 24 hours
          </AppText>
          <AppText style={styles.info}>
            • Funds will be sent to your registered bank account
          </AppText>
          <AppText style={styles.info}>
            • You can track status in transactions
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 28,
  },
  title: {
    ...theme.typography.subheading,
    color: theme.colors.text,
    marginTop: 12,
    textAlign: 'center'
  },
  sub: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
    color: theme.colors.text,
  },
  box: {
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: "100%",
  },
  info: {
    fontSize: 13,
    marginBottom: 6,
    opacity: 0.9,
    color: theme.colors.text,
  },
});
