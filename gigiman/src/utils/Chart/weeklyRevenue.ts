import { Booking } from "@/api/profile.api";
export function getWeeklyRevenue(bookings: Booking[]) {
  // Labels in order
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const revenueMap: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
  };

  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(today.getDate() - 6);

  bookings.forEach((booking) => {
    if (booking.status !== "COMPLETED") return;

    const date = new Date(booking.createdAt);
    if (date < last7Days) return;

    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    if (revenueMap[day] !== undefined) {
      revenueMap[day] += booking.totalPrice || 0;
    }
  });

  return {
    labels,
    data: labels.map((day) => revenueMap[day]),
  };
}
