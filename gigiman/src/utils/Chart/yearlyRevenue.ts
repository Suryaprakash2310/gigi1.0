import { Booking } from "@/api/profile.api";

export function getYearlyRevenue(bookings: Booking[]) {
    const labels: string[] = [];
    const revenueMap: Record<string, number> = {};

    const today = new Date();

    // Last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        labels.push(monthLabel);
        revenueMap[monthLabel] = 0;
    }

    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    bookings.forEach((booking) => {
        if (booking.status !== "COMPLETED") return;

        const date = new Date(booking.createdAt);
        if (date < lastYear) return;

        const monthLabel = date.toLocaleString('default', { month: 'short' });

        // Only count if it falls within our generated labels (handles edge cases with dates)
        if (revenueMap[monthLabel] !== undefined) {
            revenueMap[monthLabel] += booking.totalPrice || 0;
        }
    });

    return {
        labels,
        data: labels.map((label) => revenueMap[label]),
    };
}
