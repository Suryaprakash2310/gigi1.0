import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "@/socket/socket";
import { fetchPartRequestById } from "@/api/parts.api";

/* =========================================================
   TYPES
========================================================= */

interface ToolShopContextType {
  workingMode: boolean;
  toggleWorkingMode: (value: boolean) => void;

  incomingRequests: any[];
  acceptedRequests: any[];

  acceptRequest: (req: any) => void;
  rejectRequest: (req: any) => void;

  verifyOtp: (requestId: string, otp: string) => void;
  
  trackingId: string | null;
  setTrackingId: (id: string | null) => void;
  trackLocation: any;

  activeRequest: any | null;
  otpModalVisible: boolean;
  setOtpModalVisible: (visible: boolean) => void;
  setActiveRequest: (request: any | null) => void;
}

/* =========================================================
   CONTEXT
========================================================= */

const ToolShopContext = createContext<ToolShopContextType | null>(null);

export const useToolShop = () => {
  const ctx = useContext(ToolShopContext);
  if (!ctx) throw new Error("Must use inside ToolShopProvider");
  return ctx;
};

/* =========================================================
   PROVIDER
========================================================= */

export const ToolShopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workingMode, setWorkingMode] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);

  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackLocation, setTrackLocation] = useState<any>(null);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  /* =========================================================
     LOAD SHOP ID
  ========================================================= */

  useEffect(() => {
    AsyncStorage.getItem("providerId").then(setShopId);
  }, []);

  /* =========================================================
     WORKING MODE TOGGLE
  ========================================================= */

  const toggleWorkingMode = useCallback(
    (value: boolean) => {
      setWorkingMode(value);

      if (value) {
        if (!socket.connected) socket.connect();

        // socket.once("connect", () => {
        //   if (shopId) {
        //     console.log("🟢 Toolshop registered:", shopId);
        //     socket.emit("register-toolshop", { shopId });
        //   }
        // });
      } else {
        socket.disconnect();
        setIncomingRequests([]);
        setAcceptedRequests([]);
        setTrackingId(null);
        setTrackLocation(null);
      }
    },
    [shopId]
  );

  /* =========================================================
     RECEIVE INCOMING TOOLSHOP REQUEST
  ========================================================= */
   
  useEffect(() => {
    if (!workingMode) return;
        console.log("🔌 Listening for toolshop requests...");
    const handleIncomingRequest = async ({
      requestId,
    }: {
      requestId: string;
    }) => {
      console.log("📥 Received toolshop request:", requestId);
      try {
        const request = await fetchPartRequestById(requestId);
        if (!request) return;

        setIncomingRequests((prev) => {
          if (prev.some((r) => r.requestId === request._id)) return prev;
          return [{ ...request, requestId: request._id }, ...prev];
        });
      } catch (err) {
        console.log("Failed to fetch request:", err);
      }
    };

    socket.on("toolshop-booking-request", handleIncomingRequest);

    return () => {
      socket.off("toolshop-booking-request", handleIncomingRequest);
    };
  }, [workingMode]);

  /* =========================================================
     ACCEPT REQUEST
  ========================================================= */

  const acceptRequest = useCallback((req: any) => {
    socket.emit("toolshop-accept", {
      requestId: req.requestId,
    });

    setIncomingRequests((prev) =>
      prev.filter((r) => r.requestId !== req.requestId)
    );

    setAcceptedRequests((prev) => [
      { ...req, status: "READY_FOR_PICKUP" },
      ...prev,
    ]);
  }, []);

  /* =========================================================
     REJECT REQUEST
  ========================================================= */

  const rejectRequest = useCallback((req: any) => {
    socket.emit("toolshop-reject", {
      requestId: req.requestId,
    });

    setIncomingRequests((prev) =>
      prev.filter((r) => r.requestId !== req.requestId)
    );
  }, []);

  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const verifyOtp = useCallback((requestId: string, otp: string) => {
    socket.emit("verify-part-otp", { requestId, otp });
  }, []);

  useEffect(() => {
    const handleOtpSuccess = ({ requestId }: any) => {
      console.log("✅ Part OTP verified:", requestId);
      setOtpModalVisible(false);
      setAcceptedRequests((prev) =>
        prev.filter((r) => r.requestId !== requestId)
      );
      
      setActiveRequest(null);
    };

    const handleOtpFailed = ({ message }: any) => {
      console.log("❌ Part OTP failed:", message);
    };

    socket.on("part-otp-success", handleOtpSuccess);
    socket.on("part-otp-failed", handleOtpFailed);

    return () => {
      socket.off("part-otp-success", handleOtpSuccess);
      socket.off("part-otp-failed", handleOtpFailed);
    };
  }, [activeRequest]);

  /* =========================================================
     LIVE TRACKING
  ========================================================= */

  useEffect(() => {
    if (!trackingId) return;

    console.log("🔌 Joining tracking room:", trackingId);
    socket.emit("join-tracking", { bookingId: trackingId });

    const handleLocationUpdate = (data: any) => {
      if (data.bookingId === trackingId) {
        setTrackLocation(data);
      }
    };

    socket.on("servicer-location-update", handleLocationUpdate);

    return () => {
      socket.off("servicer-location-update", handleLocationUpdate);
    };
  }, [trackingId]);

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  return (
    <ToolShopContext.Provider
      value={{
        workingMode,
        toggleWorkingMode,
        incomingRequests,
        acceptedRequests,
        acceptRequest,
        rejectRequest,
        verifyOtp,
        trackingId,
        setTrackingId,
        trackLocation,
        activeRequest,
        otpModalVisible,
        setOtpModalVisible,
        setActiveRequest,
      }}
    >
      {children}
    </ToolShopContext.Provider>
  );
};