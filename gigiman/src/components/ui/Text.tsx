import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";

interface AppTextProps extends TextProps {
  variant?:
    | "titleLarge"
    | "titleMedium"
    | "titleSmall"
    | "bodyLarge"
    | "bodyMedium"
    | "bodySmall"
    | "caption";
  style?: any;
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = "bodyMedium",
  style,
  ...rest
}) => {
  return (
    <RNText style={[styles[variant], style]} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  titleLarge: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  bodyLarge: {
    fontSize: 18,
    color: "#000",
  },
  bodyMedium: {
    fontSize: 16,
    color: "#000",
  },
  bodySmall: {
    fontSize: 14,
    color: "#000",
  },
  caption: {
    fontSize: 12,
    color: "#444",
  },
});
