import React, { createContext, useEffect, useState, ReactNode, useContext } from "react";
import { ProfileAPI } from "@/api/profile.api";
import { AuthContext } from "./AuthContext";

interface ProfileContextType {
  profile: any;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: false,
  refreshProfile: async () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { userToken } = useContext(AuthContext);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    if (!userToken) {
      console.log("❌ No token, skipping profile load");
      return;
    }
    try {
      console.log("⏳ Loading profile...");
      setLoading(true);
      const employee = await ProfileAPI.getProfile(userToken);
      setProfile(employee);
      console.log("✅ Profile Loaded:", employee.role);
    } catch (err) {
      console.error("❌ Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userToken]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
