import React, { createContext, useEffect, useState } from "react";
import { Booking, BookingAPI, BookingHistoryResponse } from "@/api/profile.api";

interface BookingHistoryContextType {
  bookings: Booking[];
  stats: BookingHistoryResponse["stats"] | null;
  totalBookings: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const BookingHistoryContext =
  createContext<BookingHistoryContextType>({
    bookings: [],
    stats: null,
    totalBookings: 0,
    loading: false,
    refresh: async () => {},
  });

export const BookingHistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingHistoryResponse["stats"] | null>(
    null
  );
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingAPI.getRecentBookings();

      setBookings(data.bookings);
      setStats(data.stats);
      setTotalBookings(data.totalBookings);
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
        totalBookings,
        loading,
        refresh: loadBookings,
      }}
    >
      {children}
    </BookingHistoryContext.Provider>
  );
};
