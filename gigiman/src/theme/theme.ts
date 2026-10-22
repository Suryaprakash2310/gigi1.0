import { scaleFont } from './scaleFont';
import { lightTheme } from './index';

export const theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#26413C',
    primaryDark: '#07533B',
    secondary: '#F59E0B',
    accent: '#F59E0B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    button: '#26413C',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    danger: '#EF4444',
    error: '#EF4444',
    line: '#E2E8F0',
    mediumLine: '#CBD5E1',
    cardShadow: 'rgba(0,0,0,0.06)',
    splashColor: '#02492b',
  },
  typography: {
    ...lightTheme.typography,
    h1: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(32),
      fontWeight: '700' as const,
    },
    h2: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(26),
      fontWeight: '600' as const,
    },
    subheading: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(20),
      fontWeight: '500' as const,
    },
    body: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(16),
      fontWeight: '400' as const,
    },
    caption: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(12),
      fontWeight: '400' as const,
    },
    button: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(16),
      fontWeight: '600' as const,
    },
  },
  spacing: (value: number) => value * 8,
};

// Enable self-reference so both const theme = useTheme() and const { theme } = useTheme() work seamlessly
(theme as any).theme = theme;
