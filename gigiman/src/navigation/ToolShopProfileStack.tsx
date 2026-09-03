import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import RecentBookingHistoryScreen from '@/screens/profile/RecentBookingHistoryScreen';
import SupportScreen from '@/screens/profile/SupportScreen';
import RaiseIssueScreen from '@/screens/profile/RaiseIssueScreen';
import SupportTicketsScreen from '@/screens/profile/SupportTicketsScreen';
import TicketDetailScreen from '@/screens/profile/TicketDetailScreen';
import ProfileDetailsScreen from '@/screens/profile/ProfileDetailsScreen';
import ToolsScreen from '@/screens/profile/ToolsScreen';
import AboutGigimanScreen from '@/screens/profile/AboutGigimanScreen';
import TermsAndConditionsScreen from '@/screens/profile/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '@/screens/profile/PrivacyPolicyScreen';

export type ToolShopProfileStackParamList = {
    Profile: undefined;
    EditProfile: undefined;
    RecentBookingHistory: undefined;
    Support: undefined;
    RaiseIssue: { category?: string, bookingId?: string };
    SupportTickets: undefined;
    TicketDetail: { ticketId: string };
    ProfileDetails: undefined;
    Tools: undefined;
    AboutGigiman: undefined;
    TermsAndConditions: undefined;
    PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<ToolShopProfileStackParamList>();

export default function ToolShopProfileStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="RecentBookingHistory" component={RecentBookingHistoryScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="RaiseIssue" component={RaiseIssueScreen} />
      <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="Tools" component={ToolsScreen} />
    </Stack.Navigator>
  );
}