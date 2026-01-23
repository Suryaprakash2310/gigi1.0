// api/activeStatus.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./client";

export const updateActiveStatus = async (isActive: boolean) => {
  return apiClient.put(
    "/active-status",
    { isActive },
    {
      headers: {
        Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
      },
    }
  );
};
