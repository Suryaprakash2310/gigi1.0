import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/i18n';
import { BottomSheetProvider } from './src/context/BottomSheetContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { BookingHistoryProvider } from '@/context/BookingHistoryContext';
import { WalletProvider } from '@/context/WalletContext';
import { SocketProvider } from '@/socket/SocketProvider';
import BookingSocketListener from '@/listeners/BookingListener';
import { NotificationListener } from '@/listeners/NotificationListener';
import { ProviderBookingProvider } from '@/context/ProviderBookingContext';
import { ToolShopProvider } from '@/context/ToolShopContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <BookingHistoryProvider>
            <WalletProvider>
              <SocketProvider>
                <NotificationListener />
                <ToolShopProvider>
                  <ProviderBookingProvider>
                    <BottomSheetProvider>
                      <RootNavigator />
                    </BottomSheetProvider>
                  </ProviderBookingProvider>
                </ToolShopProvider>
              </SocketProvider>
            </WalletProvider>
          </BookingHistoryProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
