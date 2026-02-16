import React, { useContext, useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { BookingHistoryContext } from "@/context/BookingHistoryContext";
import { theme } from "@/theme/theme";
import RecentBookingCard from "@/components/profile/RecentBookingCard";
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

type ChartTab = "weekly" | "monthly" | "yearly";

export default function RecentBookingHistoryScreen({ navigation }: any) {
    const { bookings, stats, charts, highestEarning, loading, refresh } = useContext(BookingHistoryContext);
    const { width: screenWidth } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<ChartTab>("weekly");

    // ─────────────────────────────────────────────────────────────
    // CHART DATA (FROM BACKEND)
    // ─────────────────────────────────────────────────────────────
    const chartData = useMemo(() => {
        if (!charts) return { labels: [], data: [0] };

        const currentChart = charts[activeTab] || [];
        const labels = currentChart.map((c: any) => String(c._id));
        const data = currentChart.map((c: any) => c.amount);

        // Fallback for empty
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
            amount: h?.amount || 0
        };
    }, [highestEarning, activeTab]);


    // ─────────────────────────────────────────────────────────────
    // STATS CALCULATION (Fallback Logic)
    // ─────────────────────────────────────────────────────────────
    const displayedStats = useMemo(() => {
        // 1. Calculate Local Stats from List (Fail-safe)
        const local = (bookings || []).reduce(
            (acc, b) => {
                const isToday = new Date(b.createdAt).toDateString() === new Date().toDateString();
                const isCompleted = b.status?.toUpperCase() === "COMPLETED";

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

        // 2. Merge Backend Stats (Prioritize New Keys -> Old Keys -> Local Calc)
        // Check for "todayJobs" (New) or "todayBookings" (Old)
        const backendTodayJobs = stats.todayJobs ?? (stats as any).todayBookings;
        // Check for "totalDone" (New) or "totalCompletedJobs" (Old)
        const backendTotalDone = stats.totalDone ?? (stats as any).totalCompletedJobs;

        return {
            todayJobs: backendTodayJobs || local.todayJobs,
            todayEarnings: stats.todayEarnings || local.todayEarnings,
            totalRevenue: stats.totalRevenue || local.totalRevenue,
            totalDone: backendTotalDone || local.totalDone
        };
    }, [bookings, stats]);


    // Safe Data for Chart
    const safeChartData = chartData.data.every((v) => v === 0)
        ? chartData.data.map(() => 0.1)
        : chartData.data;

    let chartTitle = "Last 7 Days";
    if (activeTab === "monthly") chartTitle = "Last 30 Days";
    if (activeTab === "yearly") chartTitle = "Last 12 Months";

    if (loading && !bookings.length) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Booking History"
                showBack
                onBackPress={() => navigation.goBack()}
                elevation={1}
            />

            <FlatList
                data={bookings}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <RecentBookingCard booking={item} />}
                refreshing={loading}
                onRefresh={refresh}
                ListHeaderComponent={
                    <>
                        {/* ═══════════════════════════════════════
                            STATS GRID
                        ═══════════════════════════════════════ */}
                        <View style={styles.statsGrid}>
                            <View style={styles.summaryCard}>
                                <View style={[styles.iconCircle, { backgroundColor: "#EBF5FF" }]}>
                                    <Ionicons name="calendar" size={18} color="#2196F3" />
                                </View>
                                <Text style={styles.summaryValue}>{displayedStats.todayJobs}</Text>
                                <Text style={styles.summaryLabel}>Today's Jobs</Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <View style={[styles.iconCircle, { backgroundColor: "#E8F5E9" }]}>
                                    <Ionicons name="cash" size={18} color="#4CAF50" />
                                </View>
                                <Text style={[styles.summaryValue, { color: "#2E7D32" }]}>
                                    ₹{displayedStats.todayEarnings.toLocaleString("en-IN")}
                                </Text>
                                <Text style={styles.summaryLabel}>Today's Earn</Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
                                    <Ionicons name="wallet" size={18} color="#FF9800" />
                                </View>
                                <Text style={[styles.summaryValue, { color: "#E65100" }]}>
                                    ₹{displayedStats.totalRevenue.toLocaleString("en-IN")}
                                </Text>
                                <Text style={styles.summaryLabel}>Total Revenue</Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <View style={[styles.iconCircle, { backgroundColor: "#F3E5F5" }]}>
                                    <Ionicons name="checkmark-done-circle" size={18} color="#9C27B0" />
                                </View>
                                <Text style={styles.summaryValue}>{displayedStats.totalDone}</Text>
                                <Text style={styles.summaryLabel}>Total Done</Text>
                            </View>
                        </View>

                        {/* ═══════════════════════════════════════
                             HIGHEST EARNING CARD
                        ═══════════════════════════════════════ */}
                        <View style={styles.highestCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={styles.highestLabel}>Highest Earning ({
                                        activeTab === 'weekly' ? 'Day' :
                                            activeTab === 'monthly' ? 'Week' : 'Month'
                                    })</Text>
                                    <Text style={styles.highestValue}>₹{highestStat.amount.toLocaleString("en-IN")}</Text>
                                    <Text style={styles.highestSub}>
                                        {highestStat.amount > 0
                                            ? `${highestStat.label} was your best performance`
                                            : "No earnings recorded yet"}
                                    </Text>
                                </View>
                                <View style={[styles.iconCircle, { backgroundColor: "#FFFDE7", width: 44, height: 44 }]}>
                                    <Ionicons name="trophy" size={22} color="#FFD700" />
                                </View>
                            </View>
                        </View>

                        {/* ═══════════════════════════════════════
                            BAR CHART
                        ═══════════════════════════════════════ */}
                        <View style={styles.chartCard}>
                            <View style={styles.chartHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.chartTitle}>Revenue Overview</Text>
                                    <Text style={styles.chartSub}>{chartTitle}</Text>
                                </View>
                            </View>

                            <View style={styles.tabRow}>
                                {["weekly", "monthly", "yearly"].map((tab) => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.tab,
                                            activeTab === tab && styles.activeTab,
                                        ]}
                                        onPress={() => setActiveTab(tab as ChartTab)}
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
                                width={Math.max(300, Math.min(screenWidth - 48, 800))}
                                height={220}
                                yAxisLabel="₹"
                                yAxisSuffix=""
                                fromZero
                                showValuesOnTopOfBars
                                withInnerLines={false}
                                chartConfig={{
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // Green
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    barPercentage: 0.5,
                                    propsForBackgroundLines: { stroke: "#f0f0f0" },
                                    propsForLabels: { fontSize: 10 },
                                }}
                                style={{ borderRadius: 12, marginTop: 12 }}
                                verticalLabelRotation={activeTab === 'yearly' ? 45 : 0}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Recent Bookings</Text>
                    </>
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>No bookings found</Text>
                }
                contentContainerStyle={{
                    paddingBottom: 60,
                    paddingTop: Platform.OS === "android" ? 8 : 0,
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 14,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 12,
    },
    summaryCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },
    summaryLabel: {
        fontSize: 11,
        color: "#888",
        marginTop: 2,
    },
    highestCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: "#FFC107",
    },
    highestLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    highestValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#222",
        marginVertical: 4,
    },
    highestSub: {
        fontSize: 12,
        color: "#4CAF50",
        fontWeight: "500",
    },
    chartCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    chartHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
    },
    chartSub: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },
    tabRow: {
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        borderRadius: 10,
        padding: 4,
        marginBottom: 8,
        marginHorizontal: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: "#fff",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    tabText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#999",
    },
    activeTabText: {
        color: "#222",
        fontWeight: "700",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginBottom: 10,
        marginTop: 4,
    },
    empty: {
        textAlign: "center",
        color: "#888",
        marginTop: 40,
    },
});
