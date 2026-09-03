import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/Text";


interface MemberCardProps {
  empId: string;
  fullname: string;
  onRemove: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  empId,
  fullname,
  onRemove,
}) => {
  return (
    <Card style={styles.card}>
      {/* Left Side (Name + EmpID) */}
      <View style={styles.leftSection}>
        <AppText variant="bodyLarge" style={styles.name}>
          {fullname}
        </AppText>
        <AppText variant="caption" style={styles.empId}>
          {empId}
        </AppText>
      </View>

      {/* Remove Button */}
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <AppText style={styles.removeText}>Remove</AppText>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#fff",
    // Card shadow already in Common Card Component
  },

  leftSection: {
    flexDirection: "column",
  },

  name: {
    fontWeight: "600",
  },

  empId: {
    opacity: 0.6,
    marginTop: 4,
  },

  removeBtn: {
    backgroundColor: "#FF5252",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  removeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
