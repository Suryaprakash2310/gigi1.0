import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, createContext, ReactNode } from 'react';

interface AuthContextType {
  userToken: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) setUserToken(token);
    };
    loadToken();
  }, []);

  const login = async () => {
    const dummyToken = 'mock-token-123';
    await AsyncStorage.setItem('userToken', dummyToken);
    setUserToken(dummyToken);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};