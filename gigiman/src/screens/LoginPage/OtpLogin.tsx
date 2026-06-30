import React, { useRef, useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Dimensions, Alert, Keyboard
} from 'react-native';
import CustomButton from '../../components/Bottom';
import { theme } from '../../theme/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import OtpInput, { OtpInputRef } from '../../components/OtpInput';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth';
import { AuthContext } from '../../context/AuthContext';
import { UserRole } from '@/utils/enums/CommonEnum';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

export default function OtpLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { phone, confirmation: initialConfirmation } = route.params || {};
  const [confirmation, setConfirmation] = useState(initialConfirmation);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<OtpInputRef>(null);
  const { login } = useContext(AuthContext); // ✅ Use context login

  useEffect(() => {
    return () => {
      otpRef.current?.reset();
    };
  }, []);

  const handleOtpComplete = (enteredOtp: string) => setOtp(enteredOtp);

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit numeric OTP.');
      return;
    }

    try {
      setLoading(true);

      if (!confirmation) {
        throw new Error("Missing Firebase confirmation object");
      }

      console.log('Verifying Firebase OTP...');
      const userCredential = await confirmation.confirm(otp);
      const firebaseToken = await userCredential.user.getIdToken();

      if (!firebaseToken) {
        throw new Error("Failed to get Firebase token.");
      }

      console.log('Firebase verified. Verifying with backend...');
      const res = await AuthAPI.verifyOtp(phone, firebaseToken);

      if (!res?.token || !res?.role) {
        throw new Error("Invalid login response from backend");
      }

      await login(res.role, res.token, res.id);

      Alert.alert('Login Successful ✅', `Welcome ${res.role}`);

    } catch (error: any) {
      console.error('Verify OTP error:', error);
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Verification Failed', 'Too many requests. Please try again later.');
      } else if (error.code === 'auth/invalid-verification-code') {
        Alert.alert('Verification Failed', 'Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        Alert.alert('Verification Failed', 'The verification code has expired. Please request a new one.');
      } else {
        Alert.alert(
          'Verification Failed',
          error?.message || error?.response?.data?.message || 'Something went wrong'
        );
      }
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      console.log('Resending Firebase OTP...');
      const newConfirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      setConfirmation(newConfirmation);
      otpRef.current?.reset();
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many requests. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Error', 'Invalid phone number.');
      } else {
        Alert.alert('Error', error?.message || 'Failed to resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <AppHeader showBack={true} onBackPress={() => navigation.goBack()} />
          <View style={styles.container}>
            <Text style={styles.title}>Enter the OTP</Text>
            <Text style={styles.subtitle}>OTP sent to +91 {phone}</Text>

            <View style={styles.editContainer}>
              <Ionicons name="create-outline" size={20} color="#f26363" />
              <Text style={styles.editText} onPress={() => navigation.goBack()}>Edit Number</Text>
            </View>

            <OtpInput ref={otpRef} otpLength={6} onOtpComplete={handleOtpComplete} onResend={handleResend} />
          </View>

          <View style={styles.buttonWrapper}>
            <CustomButton
              title={loading ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              widthCount={0.85}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 3, justifyContent: 'flex-start', paddingHorizontal: width * 0.06, gap: 16 },
  title: { ...theme.typography.h1, color: theme.colors.text },
  subtitle: { ...theme.typography.body, color: theme.colors.text },
  editContainer: { flexDirection: 'row', alignItems: 'center' },
  editText: { marginLeft: 5, color: '#f26363', fontSize: 14, fontWeight: '500' },
  buttonWrapper: { justifyContent: 'flex-end', alignItems: 'center', marginBottom: 40 },
});
