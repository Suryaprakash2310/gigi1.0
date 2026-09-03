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
  avatar?: string;
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
  todayJobs: number;
  todayEarnings: number;
  totalRevenue: number;
  totalDone: number;
}

export interface ChartDataPoint {
  _id: string | number;
  amount: number;
}

export interface BookingHistoryResponse {
  success: boolean;
  stats: BookingStats;
  charts: {
    weekly: ChartDataPoint[];
    monthly: ChartDataPoint[];
    yearly: ChartDataPoint[];
  };
  highestEarning: {
    weekly: ChartDataPoint;
    monthly: ChartDataPoint;
    yearly: ChartDataPoint;
  };
  totalBookings: number;
  bookings: Booking[];
}

export const ProfileAPI = {
  async getProfile(token: string): Promise<EmployeeProfile> {
    const res = await apiClient.get<GetProfileResponse>(`/profile/getprofile?t=${Date.now()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
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