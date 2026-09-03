import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/Text";

interface PendingRequestCardProps {
  empId: string;
  fullname: string;
}

export const PendingRequestCard: React.FC<PendingRequestCardProps> = ({
  empId,
  fullname,
}) => {
  return (
    <Card style={styles.card}>
      <AppText variant="bodyMedium" style={styles.name}>
        {fullname}
      </AppText>

      <AppText variant="caption" style={styles.empId}>
        {empId}
      </AppText>

      <View style={styles.badge}>
        <AppText style={styles.badgeText}>Pending</AppText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  name: {
    fontWeight: "600",
  },
  empId: {
    opacity: 0.6,
    marginTop: 4,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFB300",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
  },
});
