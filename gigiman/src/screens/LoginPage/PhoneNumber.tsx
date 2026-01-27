import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import CustomButton from '../../components/Bottom';
import TextInputField from '../../components/TextInput';
import { theme } from '../../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import FloatingLabelInput from '../../components/TextInput';
import { AuthAPI } from '../../api/auth';

const { width, height } = Dimensions.get('window');
type PhoneNavProp = NativeStackNavigationProp<AuthStackParamList, 'phone'>;

export default function PhoneNumberScreen() {
  const navigation = useNavigation<PhoneNavProp>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetOtp = async() => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    // TODO: connect backend for OTP generation
    try {
      setLoading(true);
      const res= await AuthAPI.sendOtp(phone.trim());
      alert('OTP sent successfully::::'+ res.otp);
      console.log('OTP Response:', res);
       navigation.navigate('otp', { phone });
       //navigation.navigate('otp', { phone });
    } catch (e) {
      alert('Failed to send OTP');
    }finally {
      setLoading(false);
    }
    //navigation.navigate('otp', { phone }); // move to next screen
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback >
        <View style={{flex: 1,justifyContent: 'space-between'} }>

          {/* Back Arrow */}
          <AppHeader showBack={true} onBackPress={() => navigation.goBack()} />

          {/* Icon */}
          {/* <Image
            source={require('../../../assets/icons/phone_verification.png')}
            style={styles.icon}
            resizeMode="contain"
          /> */}
          <View style={styles.container}>

            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>
              A 4-digit OTP will be sent to this number
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCode}>+91</Text>
              </View>

              <View style={{ flex: 1 }}>
                <FloatingLabelInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="numeric"
                  placeholder="Enter your phone number"
                  error={error}
                />
              </View>
            </View>
            </View>

            <View style={styles.buttonWrapper}>
              <CustomButton
                title={loading ? 'Sending...' : 'Get OTP'}
                onPress={handleGetOtp}
                disabled={!phone}
                widthCount={0.9}
              />
            </View>
          
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 3,
    justifyContent: 'flex-start',
    paddingHorizontal: width * 0.06,
    gap: 16,
    //alignItems: 'flex-start'
    // paddingHorizontal: 24,
    // paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  backArrow: {
    fontSize: 28,
    color: '#000',
  },
  icon: {
    width: width * 0.22,
    height: width * 0.22,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.h1,
  },
  subtitle: {
    color: theme.colors.text,
    ...theme.typography.body,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,

    //marginBottom: 40,
  },
  countryCodeBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    //paddingBlockStart: 30,
    height: height * 0.065,

    marginRight: 10,
    justifyContent: 'center', // vertically center
    alignItems: 'center',
    flexDirection: 'column'
  },
  countryCode: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  buttonWrapper: {
    //flex:1,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    // position: 'absolute',
    // bottom: height * 0.08,
    // left: 24,
    // right: 24,
  },
});
