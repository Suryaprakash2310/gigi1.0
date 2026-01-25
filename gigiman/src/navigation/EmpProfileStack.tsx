import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeamEmployeeScreen } from '@/screens/team/TeamDashboardScreen';
import { TeamRequestsScreen } from '@/screens/team/TeamRequestsScreen';
import { AddEmployeeScreen } from '@/screens/team/TeamEmployeeScreen';
import EmployeeProfileScreen from '@/screens/profile/EmpProfileScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';

export type EmpProfileStackParamList = {
    Profile: undefined;
    team: undefined;
    AddEmp: undefined;
    TeamRequest: undefined;
    EditProfile: undefined;
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

    </Stack.Navigator>
  );
}