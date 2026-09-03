import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { UserRole } from '../utils/enums/CommonEnum';

export default function LoginScreen() {
  const { login, userRole } = useContext(AuthContext);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Page</Text>
      <Button title="Login" onPress={() => login(UserRole.SINGLE_EMPLOYEE)} />
    </View>
  );
}
