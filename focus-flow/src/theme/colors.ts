export const Colors = {
  light: {
    // Primary colors
    primary: '#007AFF',
    primaryDark: '#0051D5',
    primaryLight: '#4DA2FF',

    // Background colors
    background: '#FFFFFF',
    secondaryBackground: '#F2F2F7',
    tertiaryBackground: '#E5E5EA',
    groupedBackground: '#F2F2F7',

    // Text colors
    text: '#000000',
    secondaryText: '#3C3C43',
    tertiaryText: '#8E8E93',
    quaternaryText: '#C7C7CC',

    // UI element colors
    separator: '#C6C6C8',
    opaqueSeparator: '#C6C6C8',
    link: '#007AFF',

    // System colors
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    teal: '#5AC8FA',
    blue: '#007AFF',
    indigo: '#5856D6',
    purple: '#AF52DE',
    pink: '#FF2D55',

    // Card and surface
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',

    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
  },
  dark: {
    // Primary colors
    primary: '#0A84FF',
    primaryDark: '#006BE6',
    primaryLight: '#409CFF',

    // Background colors
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    tertiaryBackground: '#2C2C2E',
    groupedBackground: '#1C1C1E',

    // Text colors
    text: '#FFFFFF',
    secondaryText: '#EBEBF5',
    tertiaryText: '#EBEBF599',
    quaternaryText: '#EBEBF54D',

    // UI element colors
    separator: '#38383A',
    opaqueSeparator: '#38383A',
    link: '#0A84FF',

    // System colors
    red: '#FF453A',
    orange: '#FF9F0A',
    yellow: '#FFD60A',
    green: '#30D158',
    teal: '#64D2FF',
    blue: '#0A84FF',
    indigo: '#5E5CE6',
    purple: '#BF5AF2',
    pink: '#FF375F',

    // Card and surface
    card: '#1C1C1E',
    elevated: '#2C2C2E',
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Status colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#64D2FF',
  },
};

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};
