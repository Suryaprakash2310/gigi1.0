import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletHomeScreen } from '@/screens/wallet/WalletHomeScreen';
import { AddMoneyScreen } from '@/screens/wallet/AddMoneyScreen';
import { WithdrawMoneyScreen } from '@/screens/wallet/WithdrawMoneyScreen';
import { TransactionHistoryScreen } from '@/screens/wallet/TransactionHistoryScreen';

export type PocketStackParamList = {
    WalletHome: undefined;
    AddMoney: undefined;
    Withdraw: undefined;
    History: undefined;
};

const Stack = createNativeStackNavigator<PocketStackParamList>();

export default function PocketStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletHome" component={AddMoneyScreen} />     
      <Stack.Screen name="AddMoney" component={AddMoneyScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawMoneyScreen} />
      <Stack.Screen name="History" component={TransactionHistoryScreen} />
    </Stack.Navigator>
  );
}