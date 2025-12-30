import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { theme } from '../../theme/theme';
import OtpInput from '../OtpInput';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RequestItem {
  id: string;
  employeeName: string;
  employeeId: string;
  items: { name: string; qty: number }[];
  total: number;
  otp?: string;
}

interface CardProps {
  request: RequestItem;
  mode: 'pending' | 'accepted' | 'completed';
  onAccept?: () => void;
  onReject?: () => void;
  onOtpSubmit?: (otp: string) => void;
}

export const RequestCard: React.FC<CardProps> = ({
  request,
  mode,
  onAccept,
  onReject,
  onOtpSubmit,
}) => {
  const [showOtp, setShowOtp] = useState(false);

  const toggleOtp = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOtp(prev => !prev);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {request.employeeName} • #{request.employeeId}
      </Text>

      <View style={styles.partsBox}>
        {request.items.map((it, idx) => (
          <View key={idx} style={styles.partRow}>
            <Text style={styles.partName}>{it.name}</Text>
            <Text style={styles.qty}>×{it.qty}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{request.total}</Text>
      </View>

      {/* ---------- MODE: PENDING (Dashboard) ---------- */}
      {mode === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={onAccept}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={onReject}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---------- MODE: ACCEPTED (Booking) ---------- */}
      {mode === 'accepted' && (
        <>
          <TouchableOpacity style={styles.verifyBtn} onPress={toggleOtp}>
            <Text style={styles.verifyText}>{showOtp ? 'Hide OTP' : 'Enter OTP'}</Text>
          </TouchableOpacity>

          {showOtp && (
            <View style={styles.otpBox}>
              <Text style={styles.otpTitle}>Enter OTP provided by employee</Text>
              <OtpInput otpLength={4} onOtpComplete={onOtpSubmit} resendEnabled={false} />
            </View>
          )}
        </>
      )}

      {/* ---------- MODE: COMPLETED ---------- */}
      {mode === 'completed' && (
        <View style={styles.completedBox}>
          <Text style={styles.completedText}>Completed ✔</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 6 },
  partsBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginVertical: 8,
  },
  partRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  partName: { fontSize: 14, color: '#333' },
  qty: { fontSize: 14, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 6,
  },
  totalLabel: { fontSize: 15, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  actions: { flexDirection: 'row', marginTop: 10 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#4CAF50', marginRight: 6 },
  rejectBtn: { backgroundColor: '#D32F2F', marginLeft: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
  verifyBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verifyText: { color: '#fff', fontWeight: '600' },
  otpBox: {
    marginTop: 12,
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  otpTitle: { fontWeight: '600', marginBottom: 6 },
  completedBox: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  completedText: { color: '#2E7D32', fontWeight: '700', textAlign: 'center' },
});
