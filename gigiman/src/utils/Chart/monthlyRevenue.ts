import { Booking } from "@/api/profile.api";

export function getMonthlyRevenue(bookings: Booking[]) {
    const labels: string[] = [];
    const revenueMap: Record<string, number> = {};

    const today = new Date();

    // Last 4 weeks (Week 1 = most recent)
    for (let i = 3; i >= 0; i--) {
        const weekLabel = i === 0 ? "This Week" : `${i}w ago`;
        labels.push(weekLabel);
        revenueMap[weekLabel] = 0;
    }

    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 28);

    bookings.forEach((booking) => {
        if (booking.status !== "COMPLETED") return;

        const date = new Date(booking.createdAt);
        if (date < last30Days) return;

        const daysDiff = Math.floor(
            (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        const weekIndex = Math.min(Math.floor(daysDiff / 7), 3);

        const weekLabel = weekIndex === 0 ? "This Week" : `${weekIndex}w ago`;
        if (revenueMap[weekLabel] !== undefined) {
            revenueMap[weekLabel] += booking.totalPrice || 0;
        }
    });

    return {
        labels,
        data: labels.map((label) => revenueMap[label]),
    };
}
