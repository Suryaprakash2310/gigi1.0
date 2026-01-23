import { use, useContext, useEffect, useState } from "react";
import { ProfileContext } from "../context/ProfileContext";
import { TeamAPI } from "@/api/team";
import { UserRole } from "@/utils/enums/CommonEnum";

export const useTeam = () => {
  const { profile, refreshProfile } = useContext(ProfileContext);
  const REFRESH_INTERVAL = 10000; // 10 seconds
  const [members, setMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await TeamAPI.getTeamStatus();

      //console.log("TEAM STATUS API:", res); // 🔍 DEBUG

      setMembers(res.members || []);
      setPendingRequests(res.pendingRequests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);
   // ⏱ AUTO REFRESH
  useEffect(() => {
    const interval = setInterval(() => {
      loadTeam();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval); // 🧹 cleanup
  }, []);
  // Load team data when profile updates
  // useEffect(() => {
  //   const role = String(profile?.employee?.role || "").toLowerCase();
  //   // Accept multiple variants returned from backend (e.g. 'multi_employee', 'MULTIPLE_EMPLOYEE')
  //   if (role.includes("multi")) {
  //     setMembers(profile.employee.members || []);
  //     setPendingRequests(profile.employee.pendingRequests || []);
  //     console.log("Team Data Updated:", {
  //       members: profile.employee.members,
  //       pendingRequests: profile.employee.pendingRequests,
  //     });
  //   }
  //   console.log("PROFILE:", profile.employee);

  // }, [profile]);

  const refreshTeam = () => refreshProfile();
  // Call backend to add member → refresh profile
  const addMember = async (empId: string) => {
    setLoading(true);
    try {
      const res = await TeamAPI.requestAddMember(empId);
      await refreshProfile();
      //await refreshTeam();
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
