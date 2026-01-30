import React from "react";
import { View, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import { AppText } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useWallet } from "@/hooks/useWallet";
import AppHeader from "@/components/AppHeader";
import { theme } from "@/theme/theme";

export const WalletKycPendingScreen = () => {
    const { setKycStatus } = useWallet();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="KYC Status" showBack />
      <View style={styles.container}>
        <Ionicons
          name="time-outline"
          size={64}
          color={theme.colors.secondary}
        />

        <AppText style={styles.title}>
          KYC Under Review
        </AppText>

        <AppText style={styles.sub}>
          Your KYC details have been submitted successfully.
          Verification usually takes up to 24 hours.
        </AppText>

        <View style={styles.box}>
          <AppText style={styles.point}>
            • You’ll be notified once verified
          </AppText>
          <AppText style={styles.point}>
            • Withdrawals will unlock after verification
          </AppText>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setKycStatus("VERIFIED")}
          >
            <AppText style={styles.btnText}>
              Continue to Wallet
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: { ...theme.typography.subheading, color: theme.colors.text, marginTop: 12 },
  sub: { fontSize: 14, opacity: 0.75, textAlign: "center", marginTop: 8, color: theme.colors.text },
  box: { backgroundColor: 'rgba(255,149,0,0.08)', borderRadius: 12, padding: 16, marginTop: 24, width: '100%' },
  point: { fontSize: 13, marginBottom: 6, opacity: 0.9, color: theme.colors.text },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnText: { color: theme.colors.background, fontWeight: '700' },
});
