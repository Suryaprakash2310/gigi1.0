import { API_BASE_URL } from '@/utils/config/env';
import apiClient from './client'; // your axios setup
import axios from "axios";

export interface Service {
  _id: string;
  domainName: string;
  serviceImage?: string;
}



interface ServiceResponse {
  success: boolean;
  message?: string;
  count?: number;
  services: Service[];
}

export const ServiceAPI = {
  getAll: async (): Promise<ServiceResponse> => {
    const res = await apiClient.get<ServiceResponse>('/auth/services');
    return res.data;
  },
  search: async (query: string): Promise<ServiceResponse> => {
    const res = await apiClient.get<ServiceResponse>(`/auth/services/search?q=${query}`);
    return res.data;
  },
  addMultipleServices: async (token: string, serviceIds: string[]) => {
    const res = await axios.post(
      `${API_BASE_URL}/employee/addServices`,
      { serviceIds },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },
};
