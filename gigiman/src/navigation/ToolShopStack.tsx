import React from "react";
import { StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ToolShopDashboard } from "../screens/ShopDashboard";
import { ToolShopBooking } from "../screens/ShopBooking";
import ToolShopProfileScreen from "../screens/ShopProfileScreen";
// import TeamDashboardScreen from "@/screens/team/TeamDashboardScreen";
// import TeamMembersScreen from "@/screens/team/TeamEmployeeScreen";

export type ToolShopStackParamList = {
  Dashboard: undefined;
  Booking: { initialTab?: string; requestId?: string };
  profile: undefined;
};

const Tab = createBottomTabNavigator<ToolShopStackParamList>();

export default function ToolShopTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
    id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === "ios" ? 85 : 70,
            paddingBottom: Platform.OS === "ios" ? insets.bottom + 5 : 10,
          },
        ],

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 4,
        },

        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#888",

        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "speedometer" : "speedometer-outline";
          } else if (route.name === "Booking") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else {
            iconName = focused ? "person-circle" : "person-circle-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={24}
              color={color}
              style={{ marginTop: 4 }}
            />
          );
        },
      })}
    >
      {/* <Tab.Screen name="Dashboard" component={TeamMembersScreen} /> */}
      <Tab.Screen name="Dashboard" component={ToolShopDashboard} />
      <Tab.Screen name="Booking" component={ToolShopBooking} />
      <Tab.Screen name="profile" component={ToolShopProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 0.8,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    left: 0,
    right: 0,
    elevation: 3, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
});
