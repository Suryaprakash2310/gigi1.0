import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CustomButton from '../../components/Bottom';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthStack';

import AppHeader from '../../components/AppHeader';
import OtpInput, { OtpInputRef } from '../../components/OtpInput';
import { Ionicons } from '@expo/vector-icons';
import { t } from 'i18next';

const { width, height } = Dimensions.get('window');
type OtpRouteProp = RouteProp<AuthStackParamList, 'otp'>;


export default function OtpLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute<OtpRouteProp>();
const { phone } = route.params;
  //const [phone, setPhone] = useState('9876543210'); // Example: will come from previous page param
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<OtpInputRef>(null);

  //  Edit Icon → Go Back to Phone Entry Page
  const handleEditPhone = () => {
    navigation.goBack();
  };

  //  OTP Complete callback
  const handleOtpComplete = (enteredOtp: string) => {
    setOtp(enteredOtp);
    setError('');
  };

  //  Verify OTP Logic
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    // Mocking backend call
    setTimeout(() => {
      setLoading(false);
      if (otp === '1234') {
        Alert.alert('Login Successful ✅', 'You are now logged in!');
        // navigation.replace('Home'); // Example: navigate to Home screen
      } else {
        setError('Invalid OTP. Please try again.');
        otpRef.current?.reset();
      }
    }, 1500);
  };

  // Resend OTP Logic
  const handleResend = () => {
    Alert.alert('OTP Sent Again ✅', `New OTP sent to ${phone}`);
    otpRef.current?.reset();
    setOtp('');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <AppHeader showBack={true} onBackPress={() => navigation.goBack()} />

          <View style={styles.container}>
            <Text style={styles.title}>Enter the OTP number</Text>
            <Text style={styles.subtitle}>
              A 4-digit OTP was sent to your number {phone}
            </Text>

            {/* Edit phone icon */}
            <TouchableWithoutFeedback onPress={handleEditPhone}>
              <View style={styles.editContainer}>
                <Ionicons name="create-outline" size={22} color="#f26363" />
                <Text style={styles.editText}>Edit Number</Text>
              </View>
            </TouchableWithoutFeedback>

            <OtpInput
              ref={otpRef}
              onOtpComplete={handleOtpComplete}
              onResend={handleResend}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.buttonWrapper}>
            <CustomButton
              title={loading ? 'Verifying...' : t('common.verify') || 'Verify'}
              onPress={handleVerifyOtp}
              disabled={!otp || otp.length < 4 || loading}
            />
            {loading && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 10 }} />
            )}
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
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.h1,
  },
  subtitle: {
    color: theme.colors.text,
    ...theme.typography.body,
    flexWrap: 'wrap',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    //marginTop: 4,
  },
  editText: {
    marginLeft: 5,
    color: '#f26363',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    //marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  buttonWrapper: {
    justifyContent: 'flex-end',
    marginBottom: 40,
    paddingHorizontal: width * 0.06,
  },
});
