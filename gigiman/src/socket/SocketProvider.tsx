import React, { createContext, useContext, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { socket } from "@/socket/socket";
import { AuthContext } from "@/context/AuthContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import AsyncStorage from "@react-native-async-storage/async-storage";
const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: any) => {
  const { userToken } = useContext(AuthContext);

  useEffect(() => {
    if (!userToken) {
      socket.disconnect();
      return;
    }

    socket.auth = { token: userToken };

    socket.connect();

    console.log("🔌 Provider socket connecting...");

    const onConnect = () => {
      console.log("✅ Provider socket connected:", socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Provider socket disconnected:", reason);
    };

    const onError = (err: any) => {
      console.log("⚠️ Provider socket error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.disconnect();
    };
  }, [userToken]);

  useEffect(() => {
  const handleReconnect = async () => {
    console.log("🔁 Socket reconnected");

    const providerId = await AsyncStorage.getItem("providerId");
    const role = await AsyncStorage.getItem("userRole");

    if (!providerId || !role) return;

    // Re-register based on role
    if (role === UserRole.SINGLE_EMPLOYEE) {
      socket.emit("register-employee", { employeeId: providerId });
    }

    if (role === UserRole.MULTI_EMPLOYEE) {
      socket.emit("register-team", { teamId: providerId });
    }

    if (role === UserRole.TOOL_SHOP) {
      socket.emit("register-toolshop", { shopId: providerId });
    }

    console.log("✅ Provider re-registered after reconnect");

    // 2️⃣ Rejoin active booking tracking room
    const activeBookingId = await AsyncStorage.getItem("activeBookingId");

    if (activeBookingId) {
      socket.emit("join-tracking", { bookingId: activeBookingId });
      console.log("📍 Rejoined tracking room:", activeBookingId);
    }

    // 3️⃣ Signal all mounted screens to re-hydrate from API
    //    This recovers any socket events missed while offline/backgrounded
    DeviceEventEmitter.emit("socket:reconnected");
    console.log("📡 Emitted socket:reconnected for screen hydration");
  };

  socket.on("reconnect", handleReconnect);

  return () => {
    socket.off("reconnect", handleReconnect);
  };
}, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);