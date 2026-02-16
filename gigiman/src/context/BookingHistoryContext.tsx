import React, { createContext, useEffect, useState } from "react";
import { BookingAPI, BookingHistoryResponse, Booking } from "@/api/profile.api";

type HistoryData = BookingHistoryResponse;

interface BookingHistoryContextType {
  bookings: Booking[];
  stats: HistoryData["stats"] | null;
  charts: HistoryData["charts"] | null;
  highestEarning: HistoryData["highestEarning"] | null;
  totalBookings: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const BookingHistoryContext = createContext<BookingHistoryContextType>({
  bookings: [],
  stats: null,
  charts: null,
  highestEarning: null,
  totalBookings: 0,
  loading: false,
  refresh: async () => { },
});

export const BookingHistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<HistoryData["stats"] | null>(null);
  const [charts, setCharts] = useState<HistoryData["charts"] | null>(null);
  const [highestEarning, setHighestEarning] = useState<HistoryData["highestEarning"] | null>(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingAPI.getRecentBookings();

      if (data.success) {
        setBookings(data.bookings || []);
        setStats(data.stats);
        setCharts(data.charts);
        setHighestEarning(data.highestEarning);
        setTotalBookings(data.totalBookings);
      }
    } catch (err) {
      console.log("❌ Booking history load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <BookingHistoryContext.Provider
      value={{
        bookings,
        stats,
        charts,
        highestEarning,
        totalBookings,
        loading,
        refresh: loadBookings,
      }}
    >
      {children}
    </BookingHistoryContext.Provider>
  );
};
