import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, createContext, ReactNode } from 'react';

// 👇 Define what data and functions are available in this context
interface AuthContextType {
  userToken: string | null;
  userRole: string | null;
  login: (role: string, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// 👇 Default values (prevent undefined)
export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  userRole: null,
  login: async () => {},
  logout: async () => {},
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

  // Login → Save both token + role
  const login = async (role: string, token?: string) => {
    try {
      const userToken = token; // || 'mock-token-123'; // fallback for testing
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userRole', role);
      setUserToken(userToken);
      setUserRole(role);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Logout → Clear everything
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userRole']);
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
