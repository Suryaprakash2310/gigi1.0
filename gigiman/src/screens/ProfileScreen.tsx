
import React, { useRef } from 'react';
import { View, Button, Alert, Image } from 'react-native';
import OtpInput, { OtpInputRef } from '../components/OtpInput';
//import OtpInput, { OtpInputRef } from './components/OtpInput';
import DashboardIcon from '../../assets/icons/Dashboard.svg';
import { UserDetailContainer } from './EmpBooking/UserDetailContainer';


const OtpScreen = () => {
  const otpRef = useRef<OtpInputRef>(null);

  const handleOtpComplete = (otp: string) => {
    Alert.alert('OTP Entered', otp);
  };

  const handleResend = () => {
    Alert.alert('Resend OTP triggered');
  };

  return (
    // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //   <OtpInput
    //     ref={otpRef}
    //     onOtpComplete={handleOtpComplete}
    //     onResend={handleResend}
    //   />
    //   <View style={{ marginTop: 30 }}>
    //     <Button title="Reset OTP" onPress={() => otpRef.current?.reset()} />
    //     <Button title="Set OTP to 1234" onPress={() => otpRef.current?.setValue('1234')} />
    //   </View>
    // </View>
    <View>

     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* <DashboardIcon width={50} height={50} /> */}
      <Image source={require('../../assets/icons/Dashboard.svg')} />
    </View>
    <UserDetailContainer name ="John Doe" work="Plumbing" cost="$50/hr" workingHours="9am - 5pm" employeeCount="5" address="123 Main St, Cityville,  palue main road , koothur post , manachanallur tk , trichy 621216" />
    </View >
  );
};

export default OtpScreen;
