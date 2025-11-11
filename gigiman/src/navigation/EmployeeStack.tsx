import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
//import { HomeScreen } from '../screens/HomeScreen';
import {EmpBookingScreen} from '../screens/EmpBooking/index';
//import ToolShopScreen from '../screens/ToolShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { EmpDashboard } from '../screens/EmpDashboard';
import { theme } from '../theme/theme'; // optional if you have a theme file
import EmpBookingStack from './EmpBookingStack';
import EmpProfileScreen from '../screens/EmpProfileScreen';

export type AppStackParamList = {
  Home: undefined;
  Booking: { fromDashboard?: boolean; jobId?: number, jobDetails?:{
      id: number;
      name: string;
      work: string;
      cost: string;
      address: string;
      employeeCount?: string;
      workingHours?: string;
    }; } | undefined;
  Profile: undefined;
  // ToolShop: undefined;
};

const Tab = createBottomTabNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Tab.Navigator id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme?.colors?.primary ,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap | undefined;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Booking') {
            iconName = focused ? 'calendar' : 'calendar-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } 
          // else if (route.name === 'ToolShop') {
          //   return (
          //     <MaterialIcons
          //       name={focused ? 'home-repair-service' : 'build'}
          //       size={size}
          //       color={color}
          //     />
          //   );
          //} 
          else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={EmpDashboard} />
      <Tab.Screen name="Booking" component={EmpBookingStack} />
      {/* <Tab.Screen name="ToolShop" component={ProfileScreen} /> */}
      <Tab.Screen name="Profile" component={EmpProfileScreen} />
    </Tab.Navigator>
  );
}
