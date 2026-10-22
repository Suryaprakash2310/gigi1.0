import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import EmployeeStack from './EmployeeStack';
import ToolShopStack from './ToolShopStack';
import { UserRole } from '../utils/enums/CommonEnum';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BookingSocketListener from '@/listeners/BookingListener';
import NotificationScreen from '../screens/NotificationScreen';
import RecentBookingHistoryScreen from '../screens/profile/RecentBookingHistoryScreen';

import InitialSplashScreen from '../components/InitialSplashScreen';

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <InitialSplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BookingSocketListener />
        {!userToken ? (
          <AuthStack />
        ) : (
          <RootStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
            {userRole === UserRole.SINGLE_EMPLOYEE || userRole === UserRole.MULTI_EMPLOYEE ? (
              <RootStack.Screen name="EmployeeTabs" component={EmployeeStack} />
            ) : userRole === UserRole.TOOL_SHOP ? (
              <RootStack.Screen name="ToolShopTabs" component={ToolShopStack} />
            ) : (
              <RootStack.Screen name="AuthFallback" component={AuthStack} />
            )}
            <RootStack.Screen name="NotificationScreen" component={NotificationScreen} />
            <RootStack.Screen name="RecentBookingHistory" component={RecentBookingHistoryScreen} />
          </RootStack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
