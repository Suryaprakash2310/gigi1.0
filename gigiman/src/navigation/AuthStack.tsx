import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthLandingScreen from '../screens/AuthLandingScreen';
import PhoneNumberScreen from '../screens/LoginPage/PhoneNumber';
import OtpLoginScreen from '../screens/LoginPage/OtpLogin';
import LoginScreen from '../screens/LoginScreen'; // optional, if you plan to use
import { SingleEmpDetail } from '../screens/RegistrationPage/SingleEmpDetail';

export type AuthStackParamList = {
  auth: undefined;
  phone: undefined;
  otp: { phone: string; confirmation: any }; // pass phone number and Firebase confirmation object to OTP screen
  EmployeeDetail: { role: string };
  ToolShopDetail: undefined;
  login?: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="auth" component={AuthLandingScreen} />
      <Stack.Screen name="EmployeeDetail" component={SingleEmpDetail} />
      <Stack.Screen name="phone" component={PhoneNumberScreen} />
      <Stack.Screen name="otp" component={OtpLoginScreen} />
      {/* Optional */}
      <Stack.Screen name="login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
