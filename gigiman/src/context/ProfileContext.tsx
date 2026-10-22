import React, { createContext, useEffect, useState, ReactNode, useContext, useCallback, useMemo, useRef } from "react";
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
  const isFetchingRef = useRef(false);

  const loadProfile = useCallback(async () => {
    if (!userToken) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const employee = await ProfileAPI.getProfile(userToken);
      setProfile(employee);
    } catch (err) {
      setProfile(null);
      console.error("❌ Profile load error:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [userToken]);

  // Clear profile immediately when userToken changes (prevents stale data)
  useEffect(() => {
    setProfile(null);
    if (userToken) {
      loadProfile();
    }
  }, [userToken, loadProfile]);

  const contextValue = useMemo(
    () => ({ profile, loading, refreshProfile: loadProfile }),
    [profile, loading, loadProfile]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};
