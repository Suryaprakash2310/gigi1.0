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

export interface Booking {
  _id: string;
  createdAt: string;
  status: string;
  totalPrice?: number;

  serviceCategoryName?: string;

  user?: {
    fullname: string;
    phoneMasked: string;
  };

  primaryEmployee?: {
    empId: string;
    fullname: string;
  };

  servicerCompany?: {
    storeName: string;
    TeamId: string;
  };

  selectedToolshop?: {
    toolShopId: string;
    storeLocation: string;
  };
}

export interface BookingStats {
  todayBookings: number;
  last7DaysBookings: number;
  last30DaysBookings: number;
  totalCompletedJobs: number;
  totalRevenue: number;
  statusBreakdown: {
    _id: string;
    count: number;
  }[];
  popularServices: {
    _id: string;
    totalBookings: number;
  }[];
}

export interface BookingHistoryResponse {
  bookings: Booking[];
  totalBookings: number;
  stats: BookingStats;
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

export const BookingAPI = {
  async getRecentBookings(): Promise<BookingHistoryResponse> {
    const res = await apiClient.get<BookingHistoryResponse>("/booking/history/servicer");
    return res.data;
  },
};