import React, { useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ScrollView, 
  Platform 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCommission } from "../../hooks/useCommission";
import { AppText } from "@/components/ui/Text";
import { theme } from "../../theme/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type CommissionStackParamList = {
  CommissionHome: undefined;
  PayCommission: undefined;
  CommissionSuccess: undefined;
};

type NavigationProp = NativeStackNavigationProp<CommissionStackParamList, "CommissionHome">;

const SkeletonLoader = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonCard, { opacity }]} />
      <Animated.View style={[styles.skeletonCardText, { opacity }]} />
      <Animated.View style={[styles.skeletonWarning, { opacity }]} />
    </View>
  );
};

export default function CommissionHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { status, loading, error, fetchStatus } = useCommission();

  const handlePayPress = () => navigation.navigate("PayCommission");

  if (loading && !status) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>Commission</AppText>
        </View>
        <SkeletonLoader />
      </View>
    );
  }

  if (error && !status) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#d9534f" />
        <AppText style={styles.errorText}>{error}</AppText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatus}>
          <AppText style={styles.retryText}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const unpaid = status?.unpaidCommission || 0;
  const isBlocked = status?.isBlocked || false;
  const isHealthy = unpaid <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Commission</AppText>
        <TouchableOpacity style={styles.refreshIcon} onPress={fetchStatus}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Summary Card */}
        <View style={[styles.summaryCard, isHealthy && styles.healthyCard]}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardLabel}>
              {isHealthy ? "No Pending Dues" : "Total Unpaid Commission"}
            </AppText>
            {isHealthy ? (
              <MaterialCommunityIcons name="check-circle" size={24} color="#2e7d32" />
            ) : (
              <Ionicons name="wallet" size={24} color={theme.colors.primary} />
            )}
          </View>
          
          <AppText style={[styles.amountText, isHealthy && styles.amountTextHealthy]}>
            ₹{unpaid.toFixed(2)}
          </AppText>

          {!isHealthy && (
            <View style={styles.statusBadge}>
              <View style={[styles.dot, isBlocked ? styles.dotBlocked : styles.dotWarning]} />
              <AppText style={[styles.statusText, isBlocked && styles.statusTextBlocked]}>
                {isBlocked ? "Account Blocked" : "Active"}
              </AppText>
            </View>
          )}
        </View>

        {/* Warning Card */}
        {isBlocked && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialCommunityIcons name="alert" size={24} color="#d32f2f" />
              <AppText style={styles.warningTitle}>Action Required</AppText>
            </View>
            <AppText style={styles.warningDescription}>
              Your account is temporarily blocked because your unpaid commission has exceeded the limit. 
              Please pay your dues to unblock your account and continue receiving new jobs.
            </AppText>
          </View>
        )}

        {isHealthy && (
          <View style={styles.healthyContainer}>
             <MaterialCommunityIcons name="shield-check-outline" size={80} color="#4caf50" />
             <AppText style={styles.healthyTitle}>All clear!</AppText>
             <AppText style={styles.healthySubtext}>You have zero pending commissions. Keep up the great work!</AppText>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.payCTA, isHealthy && styles.payCTADisabled]} 
          onPress={handlePayPress}
          disabled={isHealthy}
          activeOpacity={0.8}
        >
          <AppText style={styles.payCTAText}>
            {isBlocked ? "Pay Now to Unblock" : "Pay Commission"}
          </AppText>
          {!isHealthy && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>
        
        <View style={styles.trustContainer}>
          <MaterialCommunityIcons name="shield-lock" size={16} color="#888" />
          <AppText style={styles.trustText}>Secure payment via Razorpay</AppText>
          <AppText style={styles.trustDot}>•</AppText>
          <AppText style={styles.trustText}>Instant Setup</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  refreshIcon: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for sticky bottom
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    marginTop: -10, // Overlap header slightly
  },
  healthyCard: {
    backgroundColor: "#f1fdf4",
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: "#5f6368",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -1,
  },
  amountTextHealthy: {
    color: "#2e7d32",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotBlocked: {
    backgroundColor: "#d32f2f",
  },
  dotWarning: {
    backgroundColor: "#f57c00",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5f6368",
  },
  statusTextBlocked: {
    color: "#d32f2f",
  },
  warningCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d32f2f",
    marginLeft: 8,
  },
  warningDescription: {
    fontSize: 14,
    color: "#b91c1c",
    lineHeight: 22,
  },
  healthyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  healthyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2e7d32",
    marginTop: 16,
  },
  healthySubtext: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  payCTA: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  payCTADisabled: {
    backgroundColor: "#e0e0e0",
  },
  payCTAText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  trustContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trustText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 6,
    fontWeight: "500",
  },
  trustDot: {
    fontSize: 12,
    color: "#ccc",
    marginHorizontal: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonCard: {
    height: 160,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: -10,
  },
  skeletonCardText: {
    height: 60,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    marginBottom: 20,
  },
  skeletonWarning: {
    height: 100,
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
  },
});
