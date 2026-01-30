import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from "react-native";
import AppHeader from "@/components/AppHeader";
import { AppText } from "@/components/ui/Text";
import { useNavigation } from "@react-navigation/native";
import { theme } from "@/theme/theme";

export const WalletKycIntroScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="KYC" showBack />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>
          Complete KYC to Use Wallet
        </AppText>

        <AppText style={styles.sub}>
          KYC is required to withdraw money and receive earnings securely.
        </AppText>

        <View style={styles.box}>
          <AppText style={styles.point}>• Withdraw earnings</AppText>
          <AppText style={styles.point}>• Receive payouts</AppText>
          <AppText style={styles.point}>• RBI compliant</AppText>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate("WalletKycForm")}
        >
          <AppText style={styles.btnText}>Start KYC</AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 24, paddingTop: 32, alignItems: 'stretch' },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 12 },
  sub: { fontSize: 14, opacity: 0.75, marginBottom: 20, color: theme.colors.text },
  box: { backgroundColor: 'rgba(14,92,230,0.04)', borderRadius: 12, padding: 16, marginBottom: 24 },
  point: { fontSize: 13, marginBottom: 6, color: theme.colors.text },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: theme.colors.background, fontWeight: '700' },
});
