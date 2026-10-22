import React, { useContext, useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ScrollView,
  BackHandler,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { BookingHistoryContext } from "@/context/BookingHistoryContext";
import { theme } from "@/theme/theme";
import RecentBookingCard from "@/components/profile/RecentBookingCard";
import BookingDetailModal from "@/components/profile/BookingDetailModal";
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { Booking } from "@/api/profile.api";

type ChartTab = "weekly" | "monthly" | "yearly";
type StatusFilter = "ALL" | "COMPLETED" | "ONGOING" | "PENDING" | "CANCELLED";

export default function RecentBookingHistoryScreen({ navigation, route }: any) {
  const { bookings, stats, charts, highestEarning, loading, refresh } =
    useContext(BookingHistoryContext);
  const { width: screenWidth } = useWindowDimensions();

  // State
  const initialFilter = (route?.params?.initialFilter as StatusFilter) || "ALL";
  const fromHome = route?.params?.from === "Home";
  const [activeTab, setActiveTab] = useState<ChartTab>("weekly");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setStatusFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate("Home");
    }
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [handleBack]);

  // ─────────────────────────────────────────────────────────────
  // STATUS COUNTS & FILTERING
  // ─────────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: bookings?.length || 0,
      COMPLETED: 0,
      ONGOING: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    (bookings || []).forEach((b) => {
      const s = (b.status || "").toUpperCase();
      if (s === "COMPLETED") counts.COMPLETED += 1;
      else if (s === "ONGOING" || s === "ACCEPTED") counts.ONGOING += 1;
      else if (s === "PENDING") counts.PENDING += 1;
      else if (s === "CANCELLED" || s === "REJECTED") counts.CANCELLED += 1;
    });

    return counts;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      // 1. Status Filter
      const s = (b.status || "").toUpperCase();
      let matchesStatus = true;
      if (statusFilter === "COMPLETED") matchesStatus = s === "COMPLETED";
      else if (statusFilter === "ONGOING")
        matchesStatus = s === "ONGOING" || s === "ACCEPTED";
      else if (statusFilter === "PENDING") matchesStatus = s === "PENDING";
      else if (statusFilter === "CANCELLED")
        matchesStatus = s === "CANCELLED" || s === "REJECTED";

      if (!matchesStatus) return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const customer = (
          b.user?.fullname ||
          (b as any)?.user?.name ||
          (b as any)?.userName ||
          ""
        ).toLowerCase();
        const service = (
          b.serviceCategoryName ||
          (b as any)?.serviceName ||
          ""
        ).toLowerCase();
        const id = (b._id || "").toLowerCase();
        const address = (
          b.address ||
          (b as any)?.userAddress ||
          ""
        ).toLowerCase();

        return (
          customer.includes(query) ||
          service.includes(query) ||
          id.includes(query) ||
          address.includes(query)
        );
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // CHART DATA (FROM BACKEND)
  // ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!charts) return { labels: ["No Data"], data: [0] };

    const currentChart = charts[activeTab] || [];
    const labels = currentChart.map((c: any) => String(c._id));
    const data = currentChart.map((c: any) => Number(c.amount) || 0);

    if (data.length === 0) return { labels: ["No Data"], data: [0] };

    return { labels, data };
  }, [charts, activeTab]);

  // ─────────────────────────────────────────────────────────────
  // HIGHEST EARNING (FROM BACKEND)
  // ─────────────────────────────────────────────────────────────
  const highestStat = useMemo(() => {
    if (!highestEarning) return { label: "-", amount: 0 };
    const h = highestEarning[activeTab];
    return {
      label: h?._id ? String(h._id) : "-",
      amount: h?.amount || 0,
    };
  }, [highestEarning, activeTab]);

  // ─────────────────────────────────────────────────────────────
  // STATS CALCULATION (Fallback Logic)
  // ─────────────────────────────────────────────────────────────
  const displayedStats = useMemo(() => {
    const local = (bookings || []).reduce(
      (acc, b) => {
        const isToday =
          new Date(b.createdAt).toDateString() === new Date().toDateString();
        const isCompleted = (b.status || "").toUpperCase() === "COMPLETED";

        if (isToday) acc.todayJobs += 1;

        if (isCompleted) {
          const price = Number(b.totalPrice) || 0;
          acc.totalRevenue += price;
          acc.totalDone += 1;
          if (isToday) acc.todayEarnings += price;
        }
        return acc;
      },
      { todayJobs: 0, todayEarnings: 0, totalRevenue: 0, totalDone: 0 }
    );

    if (!stats) return local;

    const backendTodayJobs = stats.todayJobs ?? (stats as any).todayBookings;
    const backendTotalDone =
      stats.totalDone ?? (stats as any).totalCompletedJobs;

    return {
      todayJobs: backendTodayJobs || local.todayJobs,
      todayEarnings: stats.todayEarnings || local.todayEarnings,
      totalRevenue: stats.totalRevenue || local.totalRevenue,
      totalDone: backendTotalDone || local.totalDone,
    };
  }, [bookings, stats]);

  // Safe Data for Chart
  const safeChartData = chartData.data.every((v) => v === 0)
    ? chartData.data.map(() => 0.1)
    : chartData.data;

  let chartTitle = "Last 7 Days";
  if (activeTab === "monthly") chartTitle = "Last 30 Days";
  if (activeTab === "yearly") chartTitle = "Last 12 Months";

  const handleOpenActiveJob = (bookingId: string) => {
    try {
      (navigation as any).navigate("EmployeeTabs", {
        screen: "BookingStack",
        params: {
          screen: "Booking",
          params: { bookingId },
        },
      });
    } catch {
      navigation.navigate("BookingStack", {
        screen: "Booking",
        params: { bookingId },
      });
    }
  };

  const handleRaiseIssue = (bookingId: string, bookingNumber?: string) => {
    navigation.navigate("RaiseIssue", { bookingId, bookingNumber });
  };

  if (loading && !bookings.length) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="Booking History"
          showBack
          onBackPress={handleBack}
          elevation={1}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading booking history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Booking History"
        showBack
        onBackPress={handleBack}
        elevation={1}
      />

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RecentBookingCard
            booking={item}
            onPress={() => setSelectedBooking(item)}
          />
        )}
        refreshing={loading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 80,
          paddingTop: Platform.OS === "android" ? 6 : 0,
        }}
        ListHeaderComponent={
          <>
            {/* ═══════════════════════════════════════
                STATS SUMMARY GRID (4 METRICS)
            ═══════════════════════════════════════ */}
            <View style={styles.statsGrid}>
              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: "#E3F2FD" },
                  ]}
                >
                  <Ionicons name="calendar" size={18} color="#1976D2" />
                </View>
                <Text style={styles.summaryValue}>
                  {displayedStats.todayJobs}
                </Text>
                <Text style={styles.summaryLabel}>Today's Jobs</Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: "#E8F5E9" },
                  ]}
                >
                  <Ionicons name="cash" size={18} color="#2E7D32" />
                </View>
                <Text style={[styles.summaryValue, { color: "#2E7D32" }]}>
                  ₹{displayedStats.todayEarnings.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.summaryLabel}>Today's Earn</Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: "#FFF3E0" },
                  ]}
                >
                  <Ionicons name="wallet" size={18} color="#E65100" />
                </View>
                <Text style={[styles.summaryValue, { color: "#E65100" }]}>
                  ₹{displayedStats.totalRevenue.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: "#F3E5F5" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
                    color="#7B1FA2"
                  />
                </View>
                <Text style={styles.summaryValue}>
                  {displayedStats.totalDone}
                </Text>
                <Text style={styles.summaryLabel}>Total Completed</Text>
              </View>
            </View>

            {/* ═══════════════════════════════════════
                 HIGHEST EARNING HIGHLIGHT CARD
            ═══════════════════════════════════════ */}
            <View style={styles.highestCard}>
              <View style={styles.highestInner}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.highestLabel}>
                    Highest Earning ({activeTab === "weekly"
                      ? "Day"
                      : activeTab === "monthly"
                      ? "Week"
                      : "Month"})
                  </Text>
                  <Text style={styles.highestValue}>
                    ₹{highestStat.amount.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.highestSub}>
                    {highestStat.amount > 0
                      ? `⭐ ${highestStat.label} was your highest performing period`
                      : "No earnings recorded yet in this timeframe"}
                  </Text>
                </View>
                <View style={styles.trophyCircle}>
                  <Ionicons name="trophy" size={24} color="#F57F17" />
                </View>
              </View>
            </View>

            {/* ═══════════════════════════════════════
                REVENUE OVERVIEW BAR CHART
            ═══════════════════════════════════════ */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chartTitle}>Revenue Overview</Text>
                  <Text style={styles.chartSub}>{chartTitle}</Text>
                </View>
              </View>

              <View style={styles.tabRow}>
                {(["weekly", "monthly", "yearly"] as ChartTab[]).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.activeTabText,
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BarChart
                data={{
                  labels: chartData.labels,
                  datasets: [{ data: safeChartData }],
                }}
                width={Math.max(280, Math.min(screenWidth - 48, 800))}
                height={210}
                yAxisLabel="₹"
                yAxisSuffix=""
                fromZero
                showValuesOnTopOfBars
                withInnerLines={false}
                chartConfig={{
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(142, 46, 12, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
                  barPercentage: 0.52,
                  propsForBackgroundLines: { stroke: "#f0f0f0" },
                  propsForLabels: { fontSize: 10, fontWeight: "600" },
                }}
                style={{ borderRadius: 12, marginTop: 10, alignSelf: "center" }}
                verticalLabelRotation={activeTab === "yearly" ? 40 : 0}
              />
            </View>

            {/* ═══════════════════════════════════════
                SEARCH & STATUS FILTER BAR
            ═══════════════════════════════════════ */}
            <View style={styles.filterSection}>
              {/* Search Box */}
              <View style={styles.searchBar}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#888"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Search customer, service, address..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#888" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Horizontal Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsContainer}
              >
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "COMPLETED", label: "Completed" },
                    { key: "ONGOING", label: "Ongoing" },
                    { key: "PENDING", label: "Pending" },
                    { key: "CANCELLED", label: "Cancelled" },
                  ] as Array<{ key: StatusFilter; label: string }>
                ).map((f) => {
                  const isSelected = statusFilter === f.key;
                  const count = statusCounts[f.key] || 0;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.filterPill,
                        isSelected && styles.filterPillActive,
                      ]}
                      onPress={() => setStatusFilter(f.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isSelected && styles.filterPillTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          isSelected && styles.countBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            isSelected && styles.countBadgeTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* List Header Count */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>
                Bookings ({filteredBookings.length})
              </Text>
              {(searchQuery.length > 0 || statusFilter !== "ALL") && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  <Text style={styles.clearFilterText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={36} color="#BBB" />
            </View>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySub}>
              {searchQuery.trim() || statusFilter !== "ALL"
                ? "Try adjusting your search query or filter."
                : "Your past and current service bookings will appear here."}
            </Text>
            {(searchQuery.trim() || statusFilter !== "ALL") && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
              >
                <Text style={styles.resetBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Booking Detail Modal Sheet */}
      <BookingDetailModal
        visible={!!selectedBooking}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onOpenActiveJob={handleOpenActiveJob}
        onRaiseIssue={handleRaiseIssue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1E293B",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  highestCard: {
    backgroundColor: "#FFFDF5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#FFE082",
    elevation: 2,
    shadowColor: "#F57F17",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  highestInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highestLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B78103",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highestValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#212121",
    marginVertical: 4,
  },
  highestSub: {
    fontSize: 12,
    color: "#5D4037",
    fontWeight: "500",
    lineHeight: 16,
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  chartSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  filterSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#222",
    fontWeight: "500",
  },
  filterPillsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  countBadgeTextActive: {
    color: "#FFFFFF",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
