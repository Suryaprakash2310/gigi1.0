import { socket } from "@/socket/socket";
import React, { createContext, useContext, useEffect, useState } from "react";
import { stopBookingSound } from "@/utils/BookingSoundManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "@/api/client";

export interface IncomingBooking {
  id: string;
  name: string;
  work: string;
  cost?: number;
  address: string;
  employeeCount?: number;
  isTeam?: boolean;
  teamMembers?: any[];
  teamId?: string;
  expiresAt?: number;
}

interface PickupDetails {
  requestId: string;
  otp: string;
  shop: any;
  parts: any[];
  totalCost: number;
}


interface ProviderBookingContextType {
  clientRequests: IncomingBooking[];
  workingMode: boolean;
  setWorkingMode: (val: boolean) => void;
  addBookingRequest: (booking: IncomingBooking) => void;
  removeBookingRequest: (bookingId: string) => void;

  // For runtime updates// Runtime booking state
  otpVerified: boolean;
  setOtpVerified: React.Dispatch<React.SetStateAction<boolean>>;

  pickupDetails: PickupDetails | null;
  setPickupDetails: React.Dispatch<
    React.SetStateAction<PickupDetails | null>
  >;

  waitingApproval: boolean;
  setWaitingApproval: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  waitingServiceApproval: boolean;
  setWaitingServiceApproval: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  activeBookingId: string | null;
  setActiveBookingId: (id: string | null) => void;
  partRequest: any;
  setPartRequest: React.Dispatch<React.SetStateAction<any>>;
  partsCollected: boolean;
  setPartsCollected: React.Dispatch<React.SetStateAction<boolean>>;
  resetBookingState: () => void;
}

const ProviderBookingContext =
  createContext<ProviderBookingContextType | null>(null);

export function ProviderBookingProvider({ children }: any) {
  const [clientRequests, setClientRequests] = useState<IncomingBooking[]>([]);
  const [workingMode, setWorkingMode] = useState(false);
  const [pickupDetails, setPickupDetails] = useState<PickupDetails | null>(null);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [waitingServiceApproval, setWaitingServiceApproval] = useState(false);
  const [activeBookingId, _setActiveBookingId] = useState<string | null>(null);
  const [_otpVerified, _setOtpVerified] = useState(false);
  const [partRequest, setPartRequest] = useState<any>(null);
  const [partsCollected, setPartsCollected] = useState(false);

  // Persistence Logic for OTP
  const setOtpVerified = async (val: boolean) => {
    _setOtpVerified(val);
    await AsyncStorage.setItem("otpVerified", JSON.stringify(val));
    console.log("💾 Persisted otpVerified:", val);
  };

  // Persistence Logic for Booking ID
  const setActiveBookingId = async (id: string | null) => {
    _setActiveBookingId(id);
    if (id) {
      await AsyncStorage.setItem("activeBookingId", id);
      console.log("💾 Persisted activeBookingId:", id);
    } else {
      await AsyncStorage.removeItem("activeBookingId");
      await AsyncStorage.removeItem("otpVerified"); // Clear OTP when ID is cleared
      _setOtpVerified(false);
      console.log("🗑 Cleared booking state from storage");
    }
  };

  // Load from storage on mount — API is source of truth; AsyncStorage is offline fallback
  useEffect(() => {
    const loadPersistedBooking = async () => {
      try {
        const [savedId, savedOtp] = await Promise.all([
          AsyncStorage.getItem("activeBookingId"),
          AsyncStorage.getItem("otpVerified"),
        ]);

        if (savedId) {
          console.log("🔄 Restored activeBookingId from storage:", savedId);
          _setActiveBookingId(savedId);

          // ✅ Verify otpVerified against live API rather than trusting stale cache
          try {
            const res = await apiClient.get(`/booking/${savedId}`);
            const job = (res.data as any)?.booking ?? res.data;
            const status: string = job?.status ?? "";
            const normalizedStatus = status.toLowerCase();

            const BOOKING_STATUS = { IN_PROGRESS: "in_progress" } as const;

            console.log("📊 Backend job status (boot):", status);
            console.log("🔎 Normalized status (boot):", normalizedStatus);

            const realOtpVerified = normalizedStatus === BOOKING_STATUS.IN_PROGRESS;

            console.log("🔍 API-verified otpVerified:", realOtpVerified, "(status:", status, ")");
            _setOtpVerified(realOtpVerified);
            await AsyncStorage.setItem("otpVerified", JSON.stringify(realOtpVerified));
          } catch (apiErr) {
            // Network offline — fall back to cached value
            console.log("⚠ API unreachable on boot, using cached otpVerified");
            if (savedOtp) {
              try {
                _setOtpVerified(JSON.parse(savedOtp));
              } catch (e) {
                console.error("Failed to parse savedOtp", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load booking state", e);
      }
    };
    loadPersistedBooking();
  }, []);
  const addBookingRequest = (booking: IncomingBooking) => {
    setClientRequests(prev => {
      if (prev.some(r => r.id === booking.id)) return prev;
      return [booking, ...prev];
    });
  };

  const removeBookingRequest = (bookingId: string) => {
    setClientRequests(prev =>
      prev.filter(r => r.id !== bookingId)
    );
  };
  const resetBookingState = () => {
    setActiveBookingId(null);
    setOtpVerified(false);
    setPartRequest(null);
    setWaitingApproval(false);
    setWaitingServiceApproval(false);
    setPickupDetails(null);
    setPartsCollected(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setClientRequests(prev => {
        const filtered = prev.filter(job => {
          if (!job.expiresAt) return true;
          return job.expiresAt > now;
        });

        // 🔇 Stop sound when all requests have expired
        if (prev.length > 0 && filtered.length === 0) {
          stopBookingSound();
        }

        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  // useEffect(() => {
  //   if (!activeBookingId) return;

  //   const handleToolRequestCreated = (payload: any) => {
  //     if (payload.bookingId !== activeBookingId) return;

  //     setPartRequest({
  //       requestId: payload.requestId,
  //       totalCost: payload.totalCost,
  //       status: "REQUESTED",
  //     });

  //     setWaitingApproval(true);
  //   };

  //   const handleToolPermissionApproved = (payload: any) => {
  //     if (payload.bookingId !== activeBookingId) return;

  //     setPartRequest((prev: any) =>
  //       prev ? { ...prev, status: "APPROVED_BY_USER" } : prev
  //     );

  //     setWaitingApproval(false);
  //   };

  //   socket.on("tool-request-created", handleToolRequestCreated);
  //   socket.on("tool-permission-approved", handleToolPermissionApproved);

  //   return () => {
  //     socket.off("tool-request-created", handleToolRequestCreated);
  //     socket.off("tool-permission-approved", handleToolPermissionApproved);
  //   };
  // }, [activeBookingId]);

  return (
    <ProviderBookingContext.Provider
      value={{
        clientRequests,
        workingMode,
        setWorkingMode,
        addBookingRequest,
        removeBookingRequest,
        otpVerified: _otpVerified,
        setOtpVerified,
        pickupDetails,
        setPickupDetails,
        waitingApproval,
        setWaitingApproval,
        waitingServiceApproval,
        setWaitingServiceApproval,
        activeBookingId,
        setActiveBookingId,
        resetBookingState,
        setPartRequest,
        partRequest,
        partsCollected,
        setPartsCollected,
      }}
    >
      {children}
    </ProviderBookingContext.Provider>
  );
}

export const useProviderBooking = () => {
  const ctx = useContext(ProviderBookingContext);
  if (!ctx) throw new Error("Must use inside ProviderBookingProvider");
  return ctx;
};