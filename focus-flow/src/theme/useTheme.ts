import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from './colors';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? Colors.dark : Colors.light,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadow: Shadow,
    isDark,
  };
};
