import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/Bottom';

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: theme.colors.background }}>
      {/* <CustomButton title="Continue" onPress={() => console.log('Continue')} /> */}
      <CustomButton title="Delete" disabled= {true} onPress={() => console.log('Delete')} />
      {/* <CustomButton title="Loading..." loading onPress={()=>{}}/> */}
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
