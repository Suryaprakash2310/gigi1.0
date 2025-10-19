import React, { createContext, useContext, ReactNode } from 'react';
import { theme } from '../theme/theme';

type ThemeType = typeof theme;

const ThemeContext = createContext<ThemeType>(theme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
