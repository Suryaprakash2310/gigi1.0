// api/activeStatus.ts
import apiClient from "./client";

export const updateActiveStatus = async (isActive: boolean) => {
  return apiClient.put("/active-status", { isActive });
};
