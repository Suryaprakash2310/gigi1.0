import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletHomeScreen } from '@/screens/wallet/WalletHomeScreen';
import { AddMoneyScreen } from '@/screens/wallet/AddMoneyScreen';
import { WithdrawMoneyScreen } from '@/screens/wallet/WithdrawMoneyScreen';
import { TransactionHistoryScreen } from '@/screens/wallet/TransactionHistoryScreen';
import { WithdrawStatusScreen } from '@/screens/wallet/WithdrawStatusScreen';
import { WalletEntryScreen } from '@/screens/wallet/WalletEntryScreen';
import { WalletKycFormScreen } from '@/screens/wallet/WalletKycFormScreen';
import { WalletKycPendingScreen } from '@/screens/wallet/WalletKycPendingScreen';

export type PocketStackParamList = {
  WalletEntry: undefined;
    WalletHome: undefined;
    AddMoneyScreen: undefined;
    WithdrawMoneyScreen: undefined;
    TransactionHistoryScreen: undefined;
    WithdrawStatusScreen: undefined;
    WalletKycForm: undefined;
    WalletPendingScreen: undefined;
};

const Stack = createNativeStackNavigator<PocketStackParamList>();

export default function PocketStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      {/* ENTRY GATE */}
      <Stack.Screen
        name="WalletEntry"
        component={WalletEntryScreen}
      />
      {/* WALLET FLOW */}
      <Stack.Screen name="WalletHome" component={WalletHomeScreen} />     
      <Stack.Screen name="AddMoneyScreen" component={AddMoneyScreen} />
      <Stack.Screen name="WithdrawMoneyScreen" component={WithdrawMoneyScreen} />
      <Stack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} />
      <Stack.Screen name="WithdrawStatusScreen" component={WithdrawStatusScreen} />
      {/* KYC FLOW */}
      <Stack.Screen
        name="WalletKycForm"
        component={WalletKycFormScreen}
      />
      <Stack.Screen
        name="WalletPendingScreen"
        component={WalletKycPendingScreen}
      />
    </Stack.Navigator>
  );
}