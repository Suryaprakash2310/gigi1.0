import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { theme } from '../theme/theme';

export type ThemeContextType = typeof theme & {
  theme: typeof theme;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
};

const defaultContext: ThemeContextType = {
  ...theme,
  theme,
  mode: 'light',
  setMode: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('light');

  const value = useMemo<ThemeContextType>(() => {
    return {
      ...theme,
      theme,
      mode,
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
