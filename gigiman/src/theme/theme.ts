import { scaleFont } from './scaleFont';

export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#FF9500',
    background: '#FFFFFF',
    text: '#333333',
    border: '#E5E5E5',
    success: '#34C759',
    error: '#FF3B30',
  },
  typography: {
    h1: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(32),
      fontWeight: '700' as '700',
    },
    h2: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(26),
      fontWeight: '600' as '600',
    },
    subheading: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(20),
      fontWeight: '500' as '500',
    },

    body: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(16),
      fontWeight: '400' as '400',
    },
    caption: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(12),
      fontWeight: '400' as '400',
    },
    button: {
      fontFamily: 'Poppins',
      fontSize: scaleFont(16),
      fontWeight: '600' as '600',
    },
  },
  spacing: (value: number) => value * 8,
};
