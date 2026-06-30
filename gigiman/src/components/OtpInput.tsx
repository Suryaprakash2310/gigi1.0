
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

interface OtpInputProps {
  otpLength?: number;
  onOtpComplete: (otp: string) => void;
  resendEnabled?: boolean;
  resendTime?: number; // in seconds
  onResend?: () => void;
}

export interface OtpInputRef {
  reset: () => void;
  setValue: (value: string) => void;
  focus: () => void;
}


const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({
    otpLength = 4,
    onOtpComplete,
    resendEnabled = true,
    resendTime = 60,
    onResend,
  }, ref
  ) => {
    const [otp, setOtp] = useState<string[]>(Array(otpLength).fill(''));
    const [timer, setTimer] = useState<number>(resendTime);
    const inputRefs = useRef<TextInput[]>([]);

    // Reset OTP array when length changes
    useEffect(() => {
      setOtp(Array(otpLength).fill(''));
    }, [otpLength]);

    // Timer countdown
    useEffect(() => {
      if (!resendEnabled) return;
      if (timer === 0) return;
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }, [timer, resendEnabled]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        setOtp(Array(otpLength).fill(''));
        inputRefs.current[0]?.focus();
      },
      setValue: (value: string) => {
        const digits = value.split('').slice(0, otpLength);
        const newOtp = Array(otpLength).fill('');
        digits.forEach((d, i) => (newOtp[i] = d));
        setOtp(newOtp);
        if (digits.length === otpLength) {
          onOtpComplete(digits.join(''));
        }
      },
      focus: () => {
        inputRefs.current[0]?.focus();
      },
    }));


    // Handle text change for each box
    const handleChange = (text: string, index: number) => {

      // Filter non-numeric
      const filtered = text.replace(/[^0-9]/g, '');
      // If pasted multiple digits (paste-to-fill)
      if (filtered.length > 1) {
        const chars = filtered.split('');
        const newOtp = [...otp];
        for (let i = 0; i < chars.length && i + index < otpLength; i++) {
          newOtp[i + index] = chars[i];
        }
        setOtp(newOtp);
        if (newOtp.join('').length === otpLength) {
          onOtpComplete(newOtp.join(''));
          Keyboard.dismiss();
        } else {
          inputRefs.current[Math.min(index + chars.length, otpLength - 1)]?.focus();
        }
        return;
      }



      const newOtp = [...otp];
      newOtp[index] = text;

      setOtp(newOtp);

      if (text && index < otpLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newOtp.join('').length === otpLength) {
        onOtpComplete(newOtp.join(''));
        Keyboard.dismiss();

      }
    };

    // Handle backspace
    const handleKeyPress = (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    // Handle resend
    const handleResend = () => {
      if (onResend) onResend();
      setTimer(resendTime);
    };

    return (
      <View style={styles.container}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref! }}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              returnKeyType="next"
            />
          ))}
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.text}>Didn't receive code?</Text>
          {resendEnabled && (
            timer > 0 ? (
              <Text style={styles.timerText}> Resend 00:{timer < 10 ? `0${timer}` : timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}> Resend</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  });

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  input: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    color: '#000',
    marginHorizontal: 4,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  resendText: {
    color: '#E91E63',
    fontWeight: '600',
    fontSize: 14,
  },
  timerText: {
    color: '#666',
    fontSize: 14,
  },
});

export default OtpInput;