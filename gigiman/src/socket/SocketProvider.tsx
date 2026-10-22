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

      // Rejoin active booking tracking room if one exists
      const activeBookingId = await AsyncStorage.getItem("activeBookingId");
      if (activeBookingId) {
        socket.emit("join-tracking", { bookingId: activeBookingId });
      }
    };

    const onConnect = () => {
      registerProvider(); // 🔥 Register on first connect
    };

    const onReconnect = () => {
      registerProvider(); // 🔥 Re-register on every reconnect
      DeviceEventEmitter.emit("socket:reconnected");
    };

    const onDisconnect = (reason: string) => {
      // Handle socket disconnect
    };

    const onError = (err: any) => {
      // Handle socket error
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