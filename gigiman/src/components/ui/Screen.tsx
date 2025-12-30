import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";

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
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
