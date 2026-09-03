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
import { getAuth, signInWithPhoneNumber, onAuthStateChanged } from '@react-native-firebase/auth';
import { getConfirmationResult, setConfirmationResult } from '../../utils/authSession';

const { width } = Dimensions.get('window');

export default function OtpLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { phone } = route.params || {};
  const [confirmation, setConfirmation] = useState<any>(() => getConfirmationResult() || route.params?.confirmation);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<OtpInputRef>(null);
  const isConfirming = useRef(false);
  const { login } = useContext(AuthContext); // ✅ Use context login

  useEffect(() => {
    return () => {
      otpRef.current?.reset();
    };
  }, []);

  // ⚡ Auto-verification listener (automatically triggers when Google Play Services auto-retrieves SMS)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user && (user.phoneNumber === `+91${phone}` || user.phoneNumber?.replace(/\s+/g, '') === `+91${phone}`)) {
        if (isConfirming.current) return;
        isConfirming.current = true;
        try {
          setLoading(true);
          console.log('⚡ Auto-verified by Google Play Services. Getting Firebase token...');
          const firebaseToken = await user.getIdToken();
          if (!firebaseToken) throw new Error('Failed to get Firebase token.');

          console.log('Firebase verified. Verifying with backend...');
          const res = await AuthAPI.verifyOtp(phone, firebaseToken);
          if (!res?.token || !res?.role) throw new Error('Invalid login response from backend');

          await login(res.role, res.token, res.id);
          Alert.alert('Login Successful ✅', `Welcome ${res.role}`);
        } catch (err: any) {
          console.error('Auto-verification error:', err);
        } finally {
          setLoading(false);
          isConfirming.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [phone, login]);

  const handleOtpComplete = (enteredOtp: string) => setOtp(enteredOtp);

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit numeric OTP.');
      return;
    }

    if (isConfirming.current) return;
    isConfirming.current = true;

    try {
      setLoading(true);

      const activeConfirmation = confirmation || getConfirmationResult();
      if (!activeConfirmation) {
        throw new Error("Verification session has expired. Please tap 'Resend' to get a new code.");
      }

      console.log('Verifying Firebase OTP...');
      let userCredential;
      const currentUser = getAuth().currentUser;

      if (currentUser && (currentUser.phoneNumber === `+91${phone}` || currentUser.phoneNumber?.replace(/\s+/g, '') === `+91${phone}`)) {
        userCredential = { user: currentUser };
      } else {
        userCredential = await activeConfirmation.confirm(otp);
      }

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
      isConfirming.current = false;
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      console.log('Resending Firebase OTP...');
      const authInstance = getAuth();
      const newConfirmation = await signInWithPhoneNumber(authInstance, `+91${phone}`);
      setConfirmationResult(newConfirmation);
      setConfirmation(newConfirmation);
      otpRef.current?.reset();
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many requests. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Error', 'Invalid phone number.');
      } else if (error.code === 'auth/missing-client-identifier') {
        Alert.alert(
          'App Verification Failed',
          'Firebase Play Integrity check failed. Please ensure the app SHA-1/SHA-256 fingerprints are added in Firebase Console.'
        );
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
