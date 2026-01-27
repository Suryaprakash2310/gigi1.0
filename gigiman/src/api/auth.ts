import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VerifyOtpResponse = {
  token: string;
  user?: any; // add more fields as needed
  role?: string;
  id?: string;
};

interface ResponseData {
  otp: string;
  // other fields...
}


export const AuthAPI = {
  sendOtp: async (phoneNo: string) => {
    const res = await apiClient.post<ResponseData>('/auth/send-otp', { phoneNo });
    return res.data;
  },

  verifyOtp: async (phoneNo: string, otp: string) => {
    const res = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { phoneNo, otp });

    if (res.data?.token) {
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('userRole', res.data.role);
      await AsyncStorage.setItem('employeeId', res.data.id);
    }

    return res.data;
  },

  getServices: async () => {
    const res = await apiClient.get('/auth/services');
    return res.data;
  },

  searchServices: async (query: string) => {
    const res = await apiClient.get(`/auth/services/search?q=${query}`);
    return res.data;
  },
};
