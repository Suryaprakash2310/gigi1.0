import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileAPI } from "@/api/profile.api";

interface ProfileContextType {
  profile: any;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loadingProfile: false,
  refreshProfile: async () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ==============================
  // Load Profile on App Start
  // ==============================
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = await AsyncStorage.getItem("userToken");

      if (!token) return;

      const res = await ProfileAPI.getProfile(token);
      setProfile(res);
      console.log("Profile Loaded:", res);
    } catch (err) {
      console.log("Profile Load Error:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loadingProfile,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
