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

  // Clear profile immediately when userToken changes (prevents stale data)
  useEffect(() => {
    setProfile(null);
    if (userToken) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);

  const loadProfile = async () => {
    if (!userToken) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const employee = await ProfileAPI.getProfile(userToken);
      console.log("✅ Profile loaded:", employee);
      setProfile(employee);
    } catch (err) {
      setProfile(null);
      console.error("❌ Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
