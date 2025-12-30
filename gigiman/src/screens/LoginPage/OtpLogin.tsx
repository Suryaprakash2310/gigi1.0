import React, { useRef, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Dimensions, Alert, ActivityIndicator
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

const { width } = Dimensions.get('window');

export default function OtpLoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<OtpInputRef>(null);
  const { login } = useContext(AuthContext); // ✅ Use context login

  const handleOtpComplete = (enteredOtp: string) => setOtp(enteredOtp);

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      console.log(otp,"otp")
      console.log(phone,"phone")
      const res = await AuthAPI.verifyOtp(phone.trim(), otp.trim());

      if (res?.token) {
        // ✅ Trigger global login
        //await login(res.role, res.token);
        await login(res.role)
        console.log('Login Successful ✅', `Welcome ${res.role}`)

        Alert.alert('Login Successful ✅', `Welcome ${res.role}`);
        await login(res.role, res.token)
        // Navigation automatically handled by RootNavigator
      } else {
        Alert.alert('Failed', 'Invalid OTP or unauthorized user.');
        console.log('Failed', 'Invalid OTP or unauthorized user.')
        otpRef.current?.reset();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'OTP verification failed');
      console.log('Error', error.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await AuthAPI.sendOtp(phone);
      Alert.alert('Success', 'OTP resent successfully');
      otpRef.current?.reset();
    } catch {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <AppHeader showBack={true} onBackPress={() => navigation.goBack()} />
          <View style={styles.container}>
            <Text style={styles.title}>Enter the OTP</Text>
            <Text style={styles.subtitle}>OTP sent to +91 {phone}</Text>

            <View style={styles.editContainer}>
              <Ionicons name="create-outline" size={20} color="#f26363" />
              <Text style={styles.editText} onPress={() => navigation.goBack()}>Edit Number</Text>
            </View>

            <OtpInput ref={otpRef} otpLength={4} onOtpComplete={handleOtpComplete} onResend={handleResend} />
          </View>

          <View style={styles.buttonWrapper}>
            <CustomButton
              title={loading ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length < 4}
              widthCount={0.85}
            />
            {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 10 }} />}
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
