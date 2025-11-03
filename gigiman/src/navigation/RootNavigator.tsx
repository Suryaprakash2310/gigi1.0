// src/navigation/RootNavigator.tsx
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import EmployeeStack from './EmployeeStack';
import ToolShopStack from './ToolShopStack';
import { UserRole } from '../utils/enums/CommonEnum';
import { View, ActivityIndicator } from 'react-native';

// import SplashScreen from '../screens/SplashScreen';

export default function RootNavigator() {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  //if (isLoading) return <SplashScreen />; // or return null while loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }


  return (
    <NavigationContainer>
      {!userToken ? (
        <AuthStack />
      ) : userRole === UserRole.SINGLE_EMPLOYEE || userRole === UserRole.MULTI_EMPLOYEE ? (
        <EmployeeStack />
      ) : userRole === UserRole.TOOL_SHOP ? (
        <ToolShopStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
