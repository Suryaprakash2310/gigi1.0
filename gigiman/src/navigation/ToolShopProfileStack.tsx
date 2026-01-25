import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';

export type ToolShopProfileStackParamList = {
    Profile: undefined;
    EditProfile: undefined;
};

const Stack = createNativeStackNavigator<ToolShopProfileStackParamList>();

export default function ToolShopProfileStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

    </Stack.Navigator>
  );
}