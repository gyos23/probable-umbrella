import { useEffect, useState } from 'react';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from './colors';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Type support
  const [fontScale, setFontScale] = useState(1);

  // Reduced Motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Get initial font scale
    AccessibilityInfo.isScreenReaderEnabled().then(() => {
      // Font scale is available through Dimensions
      const { fontScale: currentScale } = require('react-native').Dimensions.get('window');
      setFontScale(currentScale);
    });

    // Get reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for changes
    const dimensionsSubscription = require('react-native').Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setFontScale(window.fontScale);
      }
    );

    // Listen for reduced motion changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      dimensionsSubscription?.remove();
      reduceMotionSubscription?.remove();
    };
  }, []);

  // Scale typography based on user's font size preference
  const scaledTypography = Object.entries(Typography).reduce((acc, [key, value]) => {
    acc[key] = {
      ...value,
      fontSize: value.fontSize * fontScale,
      lineHeight: value.lineHeight * fontScale,
    };
    return acc;
  }, {} as typeof Typography);

  return {
    colors: isDark ? Colors.dark : Colors.light,
    typography: scaledTypography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadow: Shadow,
    isDark,
    fontScale,
    reduceMotion,
    // Animation duration helper
    animationDuration: (baseMs: number) => reduceMotion ? 0 : baseMs,
  };
};
