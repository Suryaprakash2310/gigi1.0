import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';
import CustomButton from '../components/Bottom';
import { BottomSheetType, useBottomSheet } from '../context/BottomSheetContext';

type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;

export default function AuthLandingScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { openSheet } = useBottomSheet();
   const handleCategorySelect = (category: string) => {
    navigation.navigate('EmployeeDetail', { role: category });
    // if (category === 'TOOL_SHOP') {
    //   navigation.navigate('ToolShopDetail');
    // } else {
    //   navigation.navigate('EmployeeDetail', { role: category });
    // }
  };


  return (
    <>
    
    <View style={styles.container}>
      <Image
        source={require('../../assets/icons/gigiman_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Welcome to Gigiman</Text>
      <Text style={styles.subtitle}>Your trusted service partner</Text>
    </View>
    <View style={styles.bottomcontainer}>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Login"
          onPress={() =>{navigation.navigate('phone')}}
        />
        </View>
        <Pressable onPress={() =>{openSheet(BottomSheetType.REGISTRATION_CATAGORY_SHEET,{  onSelect: handleCategorySelect, })}} style={{marginTop:16}}>
          <Text>Create account</Text>
        </Pressable>

        
      
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 3,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 280,
    height: 280,
    //marginBottom: 32,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    //marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  bottomcontainer:{
    flex:1, 
    justifyContent:'center',
    alignItems: 'center',  
    backgroundColor: theme.colors.background,
    
  }
});
