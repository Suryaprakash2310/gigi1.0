import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeamEmployeeScreen } from '@/screens/team/TeamDashboardScreen';
import { TeamRequestsScreen } from '@/screens/team/TeamRequestsScreen';
import { AddEmployeeScreen } from '@/screens/team/TeamEmployeeScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import RecentBookingHistoryScreen from '@/screens/profile/RecentBookingHistoryScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';
import RaiseIssueScreen from '@/screens/profile/RaiseIssueScreen';
import SupportScreen from '@/screens/profile/SupportScreen';

export type EmpProfileStackParamList = {
  Profile: undefined;
  team: undefined;
  AddEmp: undefined;
  TeamRequest: undefined;
  EditProfile: undefined;
  RecentBookingHistory: undefined;
  SettingsScreen: undefined;
  Support: undefined;
  RaiseIssue: { category?: string, bookingId?: string };
};

const Stack = createNativeStackNavigator<EmpProfileStackParamList>();

export default function EmpProfileStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="team" component={TeamEmployeeScreen} />
      <Stack.Screen name="AddEmp" component={AddEmployeeScreen} />
      <Stack.Screen name="TeamRequest" component={TeamRequestsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="RecentBookingHistory" component={RecentBookingHistoryScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="RaiseIssue" component={RaiseIssueScreen} />
    </Stack.Navigator>
  );
}
