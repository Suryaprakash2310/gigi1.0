import React, { useContext, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/Bottom';
import AppHeader from '../components/AppHeader';
import TextInputField from '../components/TextInput';
import TextAreaField from '../components/TextArea';
import { useTranslation } from 'react-i18next';
import { BottomSheetType, useBottomSheet } from '../context/BottomSheetContext';




export default function HomeScreen() {
  const { logout } = useContext(AuthContext);
  const theme = useTheme();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { openSheet } = useBottomSheet();
  
  return (
    <>
    <View>
      <AppHeader
  title="GIGIMAN"
  subtitle="What is your store name?"
  showBack
  rightIcon="notifications-outline"
  onBackPress={() =>{}}
/>



</View>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: theme.colors.background }}>
     <TextInputField
        label="Name"
        value={name}
        placeholder="Enter your name"
        onChangeText={setName}
        //error={!name ? 'Name is required' : ''}
      />

      <TextAreaField
        label="Description"
        value={desc}
        placeholder="Write something..."
        onChangeText={setDesc}
      />

       <Text>{t('common.save')}</Text>

      {/* <CustomButton title="Continue" onPress={() => console.log('Continue')} /> */}
      <CustomButton title="Delete"  onPress={() => openSheet(BottomSheetType.SERVICE_SHEET)} />
      {/* <CustomButton title="Loading..." loading onPress={()=>{}}/> */}
      {/* <Button title="Logout" onPress={logout} /> */}
    </View>
    </>
    
  );
}
