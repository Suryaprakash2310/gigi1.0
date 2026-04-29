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

    // ✅ Shared registration logic — runs on first connect AND every reconnect
    const registerProvider = async () => {
      const providerId = await AsyncStorage.getItem("providerId");
      const role = await AsyncStorage.getItem("userRole");

      if (!providerId || !role) return;

      if (role === UserRole.SINGLE_EMPLOYEE) {
        socket.emit("register-employee", { employeeId: providerId });
      }
      if (role === UserRole.MULTI_EMPLOYEE) {
        socket.emit("register-team", { teamId: providerId });
      }
      if (role === UserRole.TOOL_SHOP) {
        socket.emit("register-toolshop", { shopId: providerId });
      }
      console.log("✅ Provider registered:", role, providerId);

      // Rejoin active booking tracking room if one exists
      const activeBookingId = await AsyncStorage.getItem("activeBookingId");
      if (activeBookingId) {
        socket.emit("join-tracking", { bookingId: activeBookingId });
        console.log("📍 Rejoined tracking room:", activeBookingId);
      }
    };

    const onConnect = () => {
      console.log("✅ Provider socket connected:", socket.id);
      registerProvider(); // 🔥 Register on first connect
    };

    const onReconnect = () => {
      console.log("🔁 Socket reconnected");
      registerProvider(); // 🔥 Re-register on every reconnect
      DeviceEventEmitter.emit("socket:reconnected");
      console.log("📡 Emitted socket:reconnected for screen hydration");
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Provider socket disconnected:", reason);
    };

    const onError = (err: any) => {
      console.log("⚠️ Provider socket error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("reconnect", onReconnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("reconnect", onReconnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.disconnect();
    };
  }, [userToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);