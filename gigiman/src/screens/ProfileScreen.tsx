
import React, { useRef } from 'react';
import { View, Button, Alert } from 'react-native';
import OtpInput, { OtpInputRef } from '../components/OtpInput';
//import OtpInput, { OtpInputRef } from './components/OtpInput';

const OtpScreen = () => {
  const otpRef = useRef<OtpInputRef>(null);

  const handleOtpComplete = (otp: string) => {
    Alert.alert('OTP Entered', otp);
  };

  const handleResend = () => {
    Alert.alert('Resend OTP triggered');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <OtpInput
        ref={otpRef}
        onOtpComplete={handleOtpComplete}
        onResend={handleResend}
      />
      <View style={{ marginTop: 30 }}>
        <Button title="Reset OTP" onPress={() => otpRef.current?.reset()} />
        <Button title="Set OTP to 1234" onPress={() => otpRef.current?.setValue('1234')} />
      </View>
    </View>
  );
};

export default OtpScreen;
