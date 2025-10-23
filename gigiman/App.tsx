import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/i18n';
import { BottomSheetProvider } from './src/context/BottomSheetContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BottomSheetProvider>
          <RootNavigator />
        </BottomSheetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
