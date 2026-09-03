import React from 'react';
import { View } from 'react-native';
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
import SupportTicketsScreen from '@/screens/profile/SupportTicketsScreen';
import TicketDetailScreen from '@/screens/profile/TicketDetailScreen';
import ProfileDetailsScreen from '@/screens/profile/ProfileDetailsScreen';
import ServiceCategoryScreen from '@/screens/profile/ServiceCategoryScreen';
import ToolsScreen from '@/screens/profile/ToolsScreen';
import AboutGigimanScreen from '@/screens/profile/AboutGigimanScreen';
import TermsAndConditionsScreen from '@/screens/profile/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '@/screens/profile/PrivacyPolicyScreen';

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
  SupportTickets: undefined;
  TicketDetail: { ticketId: string };
  ProfileDetails: undefined;
  ServiceCategory: undefined;
  Tools: undefined;
  AboutGigiman: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
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
      <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="ServiceCategory" component={ServiceCategoryScreen} />
      <Stack.Screen name="Tools" component={ToolsScreen} />
      <Stack.Screen name="AboutGigiman" component={AboutGigimanScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
