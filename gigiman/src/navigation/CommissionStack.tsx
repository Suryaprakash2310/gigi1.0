import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommissionHomeScreen from '../screens/Commission/CommissionHomeScreen';
import PayCommissionScreen from '../screens/Commission/PayCommissionScreen';
import CommissionSuccessScreen from '../screens/Commission/CommissionSuccessScreen';
import { theme } from '../theme/theme';

export type CommissionStackParamList = {
  CommissionHome: undefined;
  PayCommission: undefined;
  CommissionSuccess: undefined;
};

const Stack = createNativeStackNavigator<CommissionStackParamList>();

export default function CommissionStack() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors?.primary || '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="CommissionHome"
        component={CommissionHomeScreen}
        options={{ title: 'Commission', headerShown: false }}
      />
      <Stack.Screen
        name="PayCommission"
        component={PayCommissionScreen}
        options={{ title: 'Pay Commission' }}
      />
      <Stack.Screen
        name="CommissionSuccess"
        component={CommissionSuccessScreen}
        options={{ title: 'Success', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
