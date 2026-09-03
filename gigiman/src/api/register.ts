// src/api/register.ts
import apiClient from './client';

export const RegisterAPI = {
  singleEmployee: (data) => apiClient.post('/singleemployee/register', data),
  multipleEmployee: (data) => apiClient.post('/multipleemployee/register', data),
  toolShop: (data) => apiClient.post('/toolshop/register', data),
};

