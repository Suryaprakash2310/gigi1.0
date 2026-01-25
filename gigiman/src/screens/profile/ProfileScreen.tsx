import React, { useContext } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { ProfileContext } from "@/context/ProfileContext";
import { AuthContext } from "@/context/AuthContext";
import { UserRole } from "@/utils/enums/CommonEnum";
import EmployeeProfileScreen from "./EmpProfileScreen";
import ToolShopProfileScreen from "./ShopProfileScreen";


export default function ProfileScreen({ navigation }: any) {
  const { profile, loading } = useContext(ProfileContext);
  const { userRole } = useContext(AuthContext);
 if (!profile) {
  return null; // or fallback UI
}
 if (loading && !profile) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
 if (userRole === UserRole.TOOL_SHOP) {
    return <ToolShopProfileScreen profile={profile} navigation={navigation} />;
  }

  if (userRole === UserRole.SINGLE_EMPLOYEE) {
    return <EmployeeProfileScreen profile={profile} navigation={navigation} />;
  }

  if (userRole === UserRole.MULTI_EMPLOYEE) {
    return <EmployeeProfileScreen profile={profile} navigation={navigation} />;
  }

  // if (userRole === UserRole.TOOL_SHOP) {
  //   return <ToolShopProfileScreen profile={profile} navigation={navigation} />;
  // }

  return null;
}
