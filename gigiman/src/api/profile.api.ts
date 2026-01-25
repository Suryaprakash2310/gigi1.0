import apiClient from "./client";


export interface EmployeeProfile {
  _id: string;
  role: 'SINGLE_EMPLOYEE' | 'MULTIPLE_EMPLOYEE' | 'TOOL_SHOP';
  fullname?: string;
  empId?: string;
  storeName?: string;
  ownerName?: string;
  TeamId?: string;
  shopName?: string;
  phoneMasked?: string;
  address?: any;
  storeLocation?: string;
}

export interface GetProfileResponse {
  success: boolean;
  employee: EmployeeProfile;
}


export const ProfileAPI = {
  async getProfile(token: string): Promise<EmployeeProfile> {
    const res = await apiClient.get<GetProfileResponse>(`/profile/getprofile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.employee;
  },

  async editProfile(payload: Record<string, any>): Promise<EmployeeProfile> {
    const res = await apiClient.put<EmployeeProfile>(`/profile/edit-profile`, payload);
    return res.data;
  },
};
