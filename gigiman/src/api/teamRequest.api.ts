import apiClient from "./client";

export interface TeamRequestItem {
  TeamId: string;
  storeName: string;
  ownerName: string;
}

export interface GetTeamRequestResponse {
  success: boolean;
  count: number;
  teams: TeamRequestItem[];
}

export interface MyTeamResponse {
  success: boolean;
  team: {
    TeamId: string;
    storeName: string;
    ownerName: string;
  } | null;
}

export const TeamRequestAPI = {
  getTeamRequests: async (): Promise<GetTeamRequestResponse> => {
    const res = await apiClient.get<GetTeamRequestResponse>("/singleemployee/showrequest");
    return res.data;
  },

  acceptRequest: async () => {
    const res = await apiClient.post("/singleemployee/acceptteamrequest");
    return res.data;
  },

  rejectRequest: async (teamId: string) => {
    const res = await apiClient.post("/singleemployee/reject-requests", {
      teamId,
    });
    return res.data;
  },
  getMyTeam: async (): Promise<MyTeamResponse> => {
    const res = await apiClient.get<MyTeamResponse>("/singleemployee/my-team");
    return res.data;
  },

  leaveTeam: async () => {
    const res = await apiClient.post("/singleemployee/leave-team");
    return res.data;
  },
};
