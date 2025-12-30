import { TeamRequestItem, TeamRequestAPI } from "@/api/teamRequest.api";
import { useState, useEffect } from "react";

export const useTeamRequests = () => {
  const [requests, setRequests] = useState<TeamRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await TeamRequestAPI.getTeamRequests();
      setRequests(res.team || []);
    } catch (err) {
      console.log("Team request load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    const res = await TeamRequestAPI.acceptRequest();
    await load();
    return res;
  };

  const reject = async (teamId: string) => {
    const res = await TeamRequestAPI.rejectRequest(teamId);
    await load();
    return res;
  };

  useEffect(() => {
    load();
  }, []);

  return { requests, loading, accept, reject, reload: load };
};
