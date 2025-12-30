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

export const ProfileAPI = {
  async getProfile(token: string): Promise<EmployeeProfile> {
    const res = await apiClient.get<EmployeeProfile>(`/profile/getprofile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async editProfile(token: string, payload: Record<string, any>): Promise<EmployeeProfile> {
    const res = await apiClient.put<EmployeeProfile>(`/profile/editprofile`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
