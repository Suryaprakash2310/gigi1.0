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

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
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
          </RootStack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
