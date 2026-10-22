import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { UserRole } from '../utils/enums/CommonEnum';
import { theme } from '../theme/theme';
import AppButton from '../components/ui/AppButton';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 20 }}>Login Page</Text>
      <AppButton title="Login" onPress={() => login(UserRole.SINGLE_EMPLOYEE)} style={{ width: '85%' }} />
    </View>
  );
}
