import React, { memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { theme } from "../../theme/theme";

interface ServiceCardProps {
  title: string;
  icon: any;
  onPress?: () => void;
  isSelected?: boolean;
}

export const ServiceCard = memo(
  ({ title, icon, onPress, isSelected = false }: ServiceCardProps) => {
    const { width } = useWindowDimensions();

    // Responsive card width (3 columns with safe spacing)
    const cardWidth = Math.min(width / 3.2, 140);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.card,
          { width: cardWidth },
          isSelected && styles.selectedCard,
        ]}
      >
        <View style={[styles.iconWrapper, isSelected && styles.selectedIconWrap]}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        </View>

        <Text
          numberOfLines={2}
          style={[styles.title, isSelected && styles.selectedText]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 18,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    // Android shadow
    elevation: 4,

    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: "#F4F6FF",
  },

  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  selectedIconWrap: {
    backgroundColor: "#E9ECFF",
  },

  icon: {
    width: 90,
    height: 90,
  },

  title: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 18,
  },

  selectedText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
