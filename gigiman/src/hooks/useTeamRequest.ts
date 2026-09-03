import { TeamRequestItem, TeamRequestAPI } from "@/api/teamRequest.api";
import { useState, useEffect } from "react";

export const useTeamRequests = () => {
  const [requests, setRequests] = useState<TeamRequestItem[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null); // ✅ NEW
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);

      // ✅ parallel fetch (no breaking change)
      const [reqRes, myTeamRes] = await Promise.all([
        TeamRequestAPI.getTeamRequests(),
        TeamRequestAPI.getMyTeam(), // ✅ NEW
      ]);

      console.log("TEAM REQUEST API RESPONSE:", reqRes);
      console.log("MY TEAM API RESPONSE:", myTeamRes);

      setRequests(reqRes.teams || []);
      setMyTeam(myTeamRes.team || null);

    } catch (err) {
      console.log("Team request load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    const res = await TeamRequestAPI.acceptRequest();
    await load(); // refresh both
    return res;
  };

  const reject = async (teamId: string) => {
    const res = await TeamRequestAPI.rejectRequest(teamId);
    await load();
    return res;
  };

  const leave = async () => {
    const res = await TeamRequestAPI.leaveTeam();
    await load();
    return res;
  };

  useEffect(() => {
    load();
  }, []);

  return {
    requests,
    myTeam, // ✅ EXPOSED
    loading,
    accept,
    reject,
    leave,
    reload: load,
  };
};
