import { use, useContext, useEffect, useState } from "react";
import { ProfileContext } from "../context/ProfileContext";
import { TeamAPI } from "@/api/team";
import { UserRole } from "@/utils/enums/CommonEnum";

export const useTeam = () => {
  const { profile, refreshProfile } = useContext(ProfileContext);

  const [members, setMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load team data when profile updates
  useEffect(() => {
    if (profile?.employee?.role === UserRole.MULTI_EMPLOYEE) {
      setMembers(profile.employee.members || []);
      setPendingRequests(profile.employee.pendingRequests || []);
      console.log("Team Data Updated:", {
        members: profile.employee.members,
        pendingRequests: profile.employee.pendingRequests,
      });
    }
  }, [profile]);

  const refreshTeam = () => refreshProfile();
  // Call backend to add member → refresh profile
  const addMember = async (empId: string) => {
    setLoading(true);
    try {
      const res = await TeamAPI.requestAddMember(empId);
      await refreshProfile();
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Call backend to remove member → refresh profile
  const removeMember = async (empId: string) => {
    setLoading(true);
    try {
      const res = await TeamAPI.removeMember(empId);
      await refreshProfile();
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    members,
    pendingRequests,
    loading,
    addMember,
    removeMember,
    refreshTeam: refreshProfile,
  };
};
