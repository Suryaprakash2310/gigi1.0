import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, createContext, ReactNode } from 'react';
import { socket } from "@/socket/socket";
import { UserRole } from '@/utils/enums/CommonEnum';
import { getAuth, signOut } from '@react-native-firebase/auth';

// 👇 Define what data and functions are available in this context
interface AuthContextType {
  userToken: string | null;
  userRole: string | null;
  login: (role: string, token?: string, id?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// 👇 Default values (prevent undefined)
export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  userRole: null,
  login: async () => { },
  logout: async () => { },
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored user details when app starts
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedToken && storedRole) {
          setUserToken(storedToken);
          setUserRole(storedRole);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);



  // useEffect(() => {
  //   if (userToken && userRole) {
  //     console.log("🔌 Provider socket connecting...");
  //     socket.connect();
  //   }

  //   return () => {
  //     if (socket.connected) {
  //       console.log("❌ Provider socket disconnect");
  //       socket.disconnect();
  //     }
  //   };
  // }, [userToken, userRole]);
  // useEffect(() => {
  //   let isMounted = true;

  //   const setupSocket = async () => {
  //     const providerId = await AsyncStorage.getItem("providerId");
  //     if (!providerId || !userRole) return;

  //     // ✅ ensure connection
  //     if (!socket.connected) {
  //       socket.connect();
  //     }

  //     // ✅ wait until connected
  //     socket.once("connect", () => {
  //       if (!isMounted) return;

  //       if (userRole === UserRole.SINGLE_EMPLOYEE) {
  //         socket.emit("register-employee", { employeeId: providerId });
  //       }

  //       if (userRole === UserRole.MULTI_EMPLOYEE) {
  //         socket.emit("register-team", { teamId: providerId });
  //       }

  //       if (userRole === UserRole.TOOL_SHOP) {
  //         socket.emit("register-toolshop", { shopId: providerId });
  //       }

  //       console.log("✅ Provider registered:", userRole, providerId);
  //     });
  //   };

  //   setupSocket();

  //   return () => {

  //     isMounted = false;
  //   };
  // }, [userRole]);



  // useEffect(() => {
  //   socket.on("new-booking-request", ({ bookingId }) => {
  //     console.log("📥 New booking request:", bookingId);
  //   });

  //   socket.on("team-booking-request", ({ bookingId }) => {
  //     console.log("🔥 TEAM REQUEST RECEIVED:", bookingId);
  //   });

  //   return () => {
  //     socket.off("new-booking-request");
  //     socket.off("team-booking-request");
  //   };
  // }, []);





  // Login → Save both token + role
  const login = async (role: string, token?: string, id?: string) => {
    console.log("🔐 Logging in:", { role, token, id });
    try {
      if (!token || !role) {
        throw new Error("Invalid login data");
      }

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userRole", role);

      if (id) {
        await AsyncStorage.setItem("providerId", id);
      }

      setUserToken(token);
      setUserRole(role);
    } catch (error) {
      console.error("Login error:", error);
    }
  };


  // Logout → Clear all session data so shared devices don't leak state
  const logout = async () => {
    try {
      await signOut(getAuth()).catch((e) => console.error('Firebase signout error:', e));

      await AsyncStorage.multiRemove([
        'userToken',
        'userRole',
        'providerId',
        'activeBookingId',
        'otpVerified',
        'token',
        'employeeId',
      ]);
      setUserToken(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ userToken, userRole, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
