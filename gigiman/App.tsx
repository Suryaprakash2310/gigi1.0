import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/i18n';
import { BottomSheetProvider } from './src/context/BottomSheetContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { BookingHistoryProvider } from '@/context/BookingHistoryContext';
import { WalletProvider } from '@/context/WalletContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <BookingHistoryProvider>
            <WalletProvider>
              <BottomSheetProvider>
                <RootNavigator />
              </BottomSheetProvider>
            </WalletProvider>
          </BookingHistoryProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
