import { BaseTheme, radius, shadow, spacing, typography, zIndex } from './base';

export type AppTheme = BaseTheme & {
  colors: {
    background: string;
    surface: string;
    primary: string;
    primaryDark: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    danger: string;
    cardShadow: string;
    splashColor: string;
    button: string;
    // Backward-compatibility aliases for gigiman
    secondary?: string;
    error?: string;
    line?: string;
    mediumLine?: string;
  };
  dark: boolean;
};

// Premium, Attractive, Psychological Light Theme from User_App
export const lightTheme: AppTheme = {
  spacing,
  radius,
  typography,
  zIndex,
  shadow,
  dark: false,
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    primary: '#26413C',
    primaryDark: '#07533B',
    accent: '#F59E0B',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    danger: '#EF4444',
    cardShadow: 'rgba(0,0,0,0.06)',
    splashColor: '#02492b',
    button: '#26413C',
    secondary: '#F59E0B',
    error: '#EF4444',
    line: '#E2E8F0',
    mediumLine: '#CBD5E1',
  },
};

// Premium Dark Theme from User_App
export const darkTheme: AppTheme = {
  spacing,
  radius,
  typography,
  zIndex,
  shadow,
  dark: true,
  colors: {
    background: '#0B1220',
    surface: '#101826',
    primary: '#285B5B',
    primaryDark: '#1DB184',
    accent: '#FBBF24',
    text: '#E6EEF3',
    textMuted: '#94A3B8',
    border: '#1E293B',
    success: '#22D3EE',
    danger: '#F87171',
    cardShadow: 'rgba(0,0,0,0.55)',
    splashColor: '#02492b',
    button: '#285B5B',
    secondary: '#FBBF24',
    error: '#F87171',
    line: '#1E293B',
    mediumLine: '#334155',
  },
};

export { radius, shadow, spacing, typography, zIndex };
