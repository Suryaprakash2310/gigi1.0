import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Dimensions, Alert } from 'react-native';
import CustomButton from '../../components/Bottom';
import TextInputField from '../../components/TextInput';
import { theme } from '../../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import FloatingLabelInput from '../../components/TextInput';
import { AuthAPI } from '../../api/auth';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { setConfirmationResult } from '../../utils/authSession';

const { width, height } = Dimensions.get('window');
type PhoneNavProp = NativeStackNavigationProp<AuthStackParamList, 'phone'>;

export default function PhoneNumberScreen() {
  const navigation = useNavigation<PhoneNavProp>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetOtp = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Phone number must start with 6, 7, 8, or 9');
      return;
    }
    setError('');
    
    try {
      setLoading(true);
      // 1. Verify existence with backend
      console.log('Verifying employee existence...');
      await AuthAPI.sendOtp(phone);

      // 2. Trigger Firebase SMS OTP
      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Platform Not Supported',
          'Firebase Authentication is only supported on native platforms (Android/iOS). Please run the app on an Android or iOS emulator/device to verify.'
        );
        return;
      }

      console.log('Sending Firebase OTP to +91' + phone);
      const authInstance = getAuth();
      const confirmation = await signInWithPhoneNumber(authInstance, `+91${phone}`);
      setConfirmationResult(confirmation);
      navigation.navigate('otp', { phone });
    } catch (e: any) {
      console.error('Failed to authenticate:', e);
      if (e.code === 'auth/too-many-requests') {
        Alert.alert('Verification Failed', 'Too many requests. Please try again later.');
      } else if (e.code === 'auth/invalid-phone-number') {
        Alert.alert('Verification Failed', 'Invalid phone number.');
      } else if (e.code === 'auth/missing-client-identifier') {
        Alert.alert(
          'App Verification Failed',
          'Firebase Play Integrity check failed. Please ensure the app SHA-1/SHA-256 fingerprints are added in Firebase Console.'
        );
      } else {
        const errorMsg = e.response?.data?.message || e.message || 'Verification service error';
        Alert.alert('Verification Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>

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
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    if (numericText.length <= 10) {
                      setPhone(numericText);
                    }
                  }}
                  keyboardType="numeric"
                  error={error}
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonWrapper}>
            <CustomButton
              title={loading ? 'Sending...' : 'Get OTP'}
              onPress={handleGetOtp}
              disabled={!phone || loading}
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
    gap: 24,
    paddingTop: 20,
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
    color: '#666',
    ...theme.typography.body,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCodeBox: {
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  countryCode: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  buttonWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 36,
  },
});
