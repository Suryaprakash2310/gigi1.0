import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { theme } from "../../theme/theme";

export const Screen: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
