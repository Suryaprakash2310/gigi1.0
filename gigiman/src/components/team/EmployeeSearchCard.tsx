import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/Text";


interface EmployeeSearchCardProps {
  empId: string;
  fullname: string;
  status: "not-eligible" | "member" | "pending" | "addable";
  onAdd?: () => void;
}

export const EmployeeSearchCard: React.FC<EmployeeSearchCardProps> = ({
  empId,
  fullname,
  status,
  onAdd,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.left}>
        <AppText variant="bodyLarge" style={styles.name}>
          {fullname}
        </AppText>
        <AppText variant="caption" style={styles.empId}>
          {empId}
        </AppText>
      </View>

      {status === "member" && (
        <View style={styles.badgeBlue}>
          <AppText style={styles.badgeText}>In Team</AppText>
        </View>
      )}

      {status === "pending" && (
        <TouchableOpacity onPress={onAdd} style={styles.badgeYellow}>
          <AppText style={styles.badgeText}>Requested</AppText>
        </TouchableOpacity>
      )}

      {status === "not-eligible" && (
        <View style={styles.badgeGrey}>
          <AppText style={styles.badgeText}>Not Eligible</AppText>
        </View>
      )}

      {status === "addable" && (
        <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
          <AppText style={styles.addText}>Add</AppText>
        </TouchableOpacity>
      )}
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
  },

  left: { flexDirection: "column" },

  name: { fontWeight: "600" },

  empId: {
    opacity: 0.6,
    marginTop: 4,
  },

  badgeBlue: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeYellow: {
    backgroundColor: "#FFB300",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeGrey: {
    backgroundColor: "#9E9E9E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  addBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
