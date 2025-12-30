// src/api/team.api.ts
import apiClient from './client';

//const apiClient = apiClient();

export interface TeamMember {
  empId: string;
  fullname: string;
}

export interface TeamStatusResponse {
  teamId: string;
  members: TeamMember[];
  pendingRequests: TeamMember[];
}


export interface SingleEmployeeLite {
  empId: string;
  fullname: string;
  teamAccepted?: boolean;
}

export interface ShowSingleEmployeeResponse {
  message: string;
  employees: SingleEmployeeLite[];
}

export interface SearchSingleEmployeeResponse {
  success: boolean;
  count: number;
  singleemployee: {
    empId: string;
    fullname: string;
    teamAccepted?: boolean;
  }[];
}
type RequestAddMemberResponse = {
  success: boolean;
  action: "sent" | "removed";
  message: string;
  team?: any; // you can type this more strictly if needed
};


export const TeamAPI = {
  // Correct method = POST
  getSingleEmployees: async (): Promise<ShowSingleEmployeeResponse> => {
    const res = await apiClient.post<ShowSingleEmployeeResponse>(
      '/multipleemployee/showSingle-employee'
    );
    return res.data;
  },

  requestAddMember: async (empId: string): Promise<RequestAddMemberResponse> => {
    const res = await apiClient.post<RequestAddMemberResponse>(
      '/multipleemployee/requesttoaddmember',
      { empId }
    );
    return res.data;
  },

  removeMember: async (empId: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(
      '/multipleemployee/removemembersfromteam',
      { empId }
    );
    return res.data;
  },
  getTeamStatus: async (): Promise<TeamStatusResponse> => {
    const res = await apiClient.get<TeamStatusResponse>('/multipleemployee/team-status');
    return res.data;
  },
  searchSingleEmployee: async (
    query: string
  ): Promise<SearchSingleEmployeeResponse> => {
    const res = await apiClient.get<SearchSingleEmployeeResponse>(
      `/multipleemployee/search-singleemp?q=${encodeURIComponent(query)}`
    );
    return res.data;
  },




};
