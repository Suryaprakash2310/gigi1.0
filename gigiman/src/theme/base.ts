export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 26,
  round: 999,
} as const;

export const typography = {   //font size
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  caption: 11,
} as const;

export const zIndex = {
  background: 0,
  content: 1,
  header: 10,
  modal: 100,
  toast: 200,
} as const;

export const shadow = {
  card: {
    light: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 3,
    },
    dark: {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export type BaseTheme = {
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  zIndex: typeof zIndex;
  shadow: typeof shadow;
};
