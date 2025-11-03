import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { theme } from "../../theme/theme";

interface ServiceCardProps {
  title: string;
  icon: any;
  onPress?: () => void;
  isSelected?: boolean;
}

export const ServiceCard = ({ title, icon, onPress, isSelected = false }: ServiceCardProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Image source={icon} style={styles.icon} resizeMode="cover" />
      <Text style={[styles.title, isSelected && styles.selectedText]}>{title}</Text>
    </TouchableOpacity>
  );
};

// slightly smaller and with spacing
const cardWidth = Dimensions.get("window").width / 3;

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    marginHorizontal: 6, // adds nice spacing between cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#4d4b4bff",
  },
  selectedCard: {
    borderColor: theme.colors.text,
    borderWidth: 2,
    backgroundColor: "#ececf3ff",
  },
  icon: {
    width: 90,
    height: 80,
    borderRadius: 12,
  },
  title: {
    marginTop: 6,
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: "center",
  },
  selectedText: {
    color: theme.colors.text,
  },
});
