import React, { createContext, useEffect, useState, useContext, useRef, useCallback, useMemo } from "react";
import { BookingAPI, BookingHistoryResponse, Booking } from "@/api/profile.api";
import { AuthContext } from "./AuthContext";

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
  const { userToken } = useContext(AuthContext);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<HistoryData["stats"] | null>(null);
  const [charts, setCharts] = useState<HistoryData["charts"] | null>(null);
  const [highestEarning, setHighestEarning] = useState<HistoryData["highestEarning"] | null>(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(false);

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const loadBookings = useCallback(async (force = false) => {
    if (!userToken) {
      setBookings([]);
      setStats(null);
      setCharts(null);
      setHighestEarning(null);
      setTotalBookings(0);
      setLoading(false);
      return;
    }

    const now = Date.now();
    // Guard against simultaneous in-flight calls and throttle rapid automated invocations
    if (isFetchingRef.current) return;
    if (!force && now - lastFetchTimeRef.current < 2500) return;

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      const data = await BookingAPI.getRecentBookings();

      if (data && data.success) {
        setBookings(data.bookings || []);
        setStats(data.stats || null);
        setCharts(data.charts || null);
        setHighestEarning(data.highestEarning || null);
        setTotalBookings(data.totalBookings || 0);
      }
    } catch (err) {
      // Ignore booking history load error
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (userToken) {
      loadBookings();
    } else {
      setBookings([]);
      setStats(null);
      setCharts(null);
      setHighestEarning(null);
      setTotalBookings(0);
    }
  }, [userToken, loadBookings]);

  const refresh = useCallback(async () => {
    await loadBookings(true);
  }, [loadBookings]);

  const contextValue = useMemo(
    () => ({
      bookings,
      stats,
      charts,
      highestEarning,
      totalBookings,
      loading,
      refresh,
    }),
    [bookings, stats, charts, highestEarning, totalBookings, loading, refresh]
  );

  return (
    <BookingHistoryContext.Provider value={contextValue}>
      {children}
    </BookingHistoryContext.Provider>
  );
};
