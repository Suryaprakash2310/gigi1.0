// src/screens/Profile/editProfile.config.ts
import { UserRole } from "@/utils/enums/CommonEnum";

export const EDIT_PROFILE_FIELDS: Record<string, { key: string; label: string }[]> = {
  [UserRole.SINGLE_EMPLOYEE]: [
    { key: "fullname", label: "Full Name" },
    { key: "address", label: "Address" },
  ],

  [UserRole.MULTI_EMPLOYEE]: [
    { key: "storeName", label: "Store Name" },
    { key: "ownerName", label: "Owner Name" },
    { key: "storeLocation", label: "Store Location" },
  ],

  [UserRole.TOOL_SHOP]: [
    { key: "shopName", label: "Shop Name" },
    { key: "ownerName", label: "Owner Name" },
    { key: "storeLocation", label: "Store Location" },
  ],
};
