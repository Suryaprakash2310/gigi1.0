import React, { useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Platform,
    useWindowDimensions,
} from "react-native";
import AppHeader from '@/components/AppHeader';
import { BookingHistoryContext } from "@/context/BookingHistoryContext";
import { theme } from "@/theme/theme";
import RecentBookingCard from "@/components/profile/RecentBookingCard";
import { LineChart } from "react-native-chart-kit";
import { getWeeklyRevenue } from "@/utils/Chart/weeklyRevenue";

export default function RecentBookingHistoryScreen({ navigation }: any) {
    const { bookings, stats, loading, refresh } = useContext(BookingHistoryContext);
    const { width: screenWidth } = useWindowDimensions();
    const weekly = getWeeklyRevenue(bookings || []);

    if (loading) {
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
            {/* 🔹 Stats summary */}
            {stats && (
                <View style={styles.statsRow}>
                    <StatItem label="Today" value={stats.todayBookings} />
                    <StatItem label="7 Days" value={stats.last7DaysBookings} />
                    <StatItem label="30 Days" value={stats.last30DaysBookings} />
                </View>
            )}

            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Weekly Revenue</Text>
                    <Text style={styles.chartSub}>Last 7 days</Text>
                </View>

                <LineChart
                    data={{
                        labels: weekly.labels,
                        datasets: [
                            {
                                data: weekly.data,
                                strokeWidth: 3,
                            },
                        ],
                    }}
                    width={Math.max(300, Math.min(screenWidth - 32, 800))}
                    height={190}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    fromZero
                    withShadow={false}
                    withDots
                    withInnerLines={false}
                    withOuterLines={false}
                    chartConfig={{
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: () => theme.colors.primary,
                        labelColor: () => "#777",
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: theme.colors.primary,
                        },
                        propsForBackgroundLines: {
                            stroke: "#eee",
                        },
                    }}

                    bezier
                    style={{ borderRadius: 12 }}
                />
            </View>



            <FlatList
                data={bookings}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <RecentBookingCard booking={item} />}
                refreshing={loading}
                onRefresh={refresh}
                ListEmptyComponent={
                    <Text style={styles.empty}>No bookings found</Text>
                }
                contentContainerStyle={{ paddingBottom: 60, paddingTop: Platform.OS === 'android' ? 8 : 0 }}
            />
        </SafeAreaView>
    );
}

const StatItem = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statItem}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
  backgroundColor: "#fafafa",
  paddingHorizontal: 14,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        backgroundColor: "#fff",
        marginHorizontal: 4,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        fontSize: 12,
        color: "#777",
        marginTop: 4,
    },
    empty: {
        textAlign: "center",
        color: "#888",
        marginTop: 40,
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
    chartHeader: {
        paddingHorizontal: 8,
        marginBottom: 6,
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

});
