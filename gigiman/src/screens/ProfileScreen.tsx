import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to profile!</Text>
      <Button title="back" onPress={() => navigation.navigate('Home')} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
