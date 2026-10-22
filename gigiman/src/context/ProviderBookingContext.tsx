import { socket } from "@/socket/socket";
import React, { createContext, useContext, useEffect, useState } from "react";
import { stopBookingSound } from "@/utils/BookingSoundManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "@/api/client";

export interface IncomingBooking {
  id: string;
  name: string;
  work: string;
  serviceCategoryName?: string;
  cost?: number;
  address: string;
  employeeCount?: number;
  isTeam?: boolean;
  teamMembers?: any[];
  teamId?: string;
  expiresAt?: number;
  coordinates?: number[];
  isScheduled?: boolean;
  scheduleDateTime?: string;
  createdAt?: string;
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
  };

  // Persistence Logic for Booking ID
  const setActiveBookingId = async (id: string | null) => {
    _setActiveBookingId(id);
    if (id) {
      await AsyncStorage.setItem("activeBookingId", id);
    } else {
      await AsyncStorage.removeItem("activeBookingId");
      await AsyncStorage.removeItem("otpVerified"); // Clear OTP when ID is cleared
      _setOtpVerified(false);
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
          _setActiveBookingId(savedId);

          // ✅ Verify booking status and otpVerified against live API rather than trusting stale cache
          try {
            const res = await apiClient.get(`/booking/${savedId}`);
            const job = (res.data as any)?.booking ?? res.data;
            const status: string = job?.status ?? "";
            const normalizedStatus = status.toLowerCase();

            // Clear state if booking is already finished or cancelled
            if (
              normalizedStatus === "completed" ||
              normalizedStatus === "cancelled" ||
              normalizedStatus === "canceled" ||
              normalizedStatus === "rejected"
            ) {
              _setActiveBookingId(null);
              await AsyncStorage.removeItem("activeBookingId");
              await AsyncStorage.removeItem("otpVerified");
              _setOtpVerified(false);

              // Check backend for any other ongoing active booking
              try {
                const activeRes = await apiClient.get<{ success: boolean; booking: any }>("/booking/active/servicer");
                if (activeRes.data?.booking?._id) {
                  const activeId = activeRes.data.booking._id;
                  _setActiveBookingId(activeId);
                  await AsyncStorage.setItem("activeBookingId", activeId);
                  const isProgress = (activeRes.data.booking.status || "").toLowerCase() === "in_progress";
                  _setOtpVerified(isProgress);
                  await AsyncStorage.setItem("otpVerified", JSON.stringify(isProgress));
                }
              } catch (activeErr) {}
              return;
            }

            const BOOKING_STATUS = { IN_PROGRESS: "in_progress" } as const;

            const realOtpVerified = normalizedStatus === BOOKING_STATUS.IN_PROGRESS;

            _setOtpVerified(realOtpVerified);
            await AsyncStorage.setItem("otpVerified", JSON.stringify(realOtpVerified));
          } catch (apiErr: any) {
            if (apiErr?.response?.status === 404 || apiErr?.response?.status === 403) {
              _setActiveBookingId(null);
              await AsyncStorage.removeItem("activeBookingId");
              await AsyncStorage.removeItem("otpVerified");
              _setOtpVerified(false);
              return;
            }
            // Network offline — fall back to cached value
            if (savedOtp) {
              try {
                _setOtpVerified(JSON.parse(savedOtp));
              } catch (e) {
                console.error("Failed to parse savedOtp", e);
              }
            }
          }
        } else {
          // Check backend for ongoing active booking if storage was empty
          try {
            const res = await apiClient.get<{ success: boolean; booking: any }>("/booking/active/servicer");
            if (res.data?.booking?._id) {
              const activeId = res.data.booking._id;
              _setActiveBookingId(activeId);
              await AsyncStorage.setItem("activeBookingId", activeId);
              const isProgress = (res.data.booking.status || "").toLowerCase() === "in_progress";
              _setOtpVerified(isProgress);
              await AsyncStorage.setItem("otpVerified", JSON.stringify(isProgress));
            }
          } catch (backendErr) {
            // Offline or no active booking
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