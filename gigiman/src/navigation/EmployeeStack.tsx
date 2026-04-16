import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
//import { HomeScreen } from '../screens/HomeScreen';
import { EmpBookingScreen } from '../screens/EmpBooking/index';
//import ToolShopScreen from '../screens/ToolShopScreen';
import { EmpDashboard } from '../screens/EmpDashboard';
import { theme } from '../theme/theme'; 
import EmpBookingStack, { BookingStackParamList } from './EmpBookingStack';
import EmpProfileScreen from '../screens/profile/EmpProfileScreen';
import { AddEmployeeScreen } from '@/screens/team/TeamEmployeeScreen';
import { TeamEmployeeScreen } from '@/screens/team/TeamDashboardScreen';
import PocketStack from './PocketStack';
import EmpProfileStack from './EmpProfileStack';
import CommissionStack from './CommissionStack';

export type AppStackParamList = {
  Home: undefined;
  BookingStack: {
    screen: keyof BookingStackParamList;
    params?: BookingStackParamList[keyof BookingStackParamList];
  };
  Pocket: undefined;
  ProfileTab: undefined;
  CommissionTab: undefined;
};

const Tab = createBottomTabNavigator<AppStackParamList>();

export default function AppStack() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme?.colors?.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.8,
          elevation: 5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom ? insets.bottom : 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap | undefined;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'BookingStack') {
            iconName = focused ? 'calendar' : 'calendar-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
          else if (route.name === 'Pocket') {
            return (
              <MaterialIcons
                name={focused ? 'account-balance-wallet' : 'account-balance-wallet'}
                size={size}
                color={color}
              />
            );
          }
          else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
          else if (route.name === 'CommissionTab') {
            return <MaterialIcons name="payments" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={EmpDashboard} />
      {/* <Tab.Screen name="Home" component={EmpDashboard} /> */}
      <Tab.Screen name="BookingStack" component={EmpBookingStack} />
      <Tab.Screen name="Pocket" component={PocketStack} />
      <Tab.Screen name="ProfileTab" component={EmpProfileStack} />
      <Tab.Screen name="CommissionTab" component={CommissionStack} />
    </Tab.Navigator>
  );
}
