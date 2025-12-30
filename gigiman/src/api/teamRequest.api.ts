import apiClient from "./client";

export interface TeamRequestItem {
  TeamId: string;
  storeName: string;
  ownerName: string;
}

export interface GetTeamRequestResponse {
  team: TeamRequestItem[];
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
};
