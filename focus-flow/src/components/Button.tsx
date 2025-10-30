import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, AccessibilityRole } from 'react-native';
import { haptics } from '../utils/haptics';
import { useTheme } from '../theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const handlePress = () => {
    // Haptic feedback (automatically handles web platform)
    haptics.light();
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        break;
      case 'large':
        baseStyle.paddingVertical = spacing.md + 2;
        baseStyle.paddingHorizontal = spacing.lg;
        break;
      default:
        baseStyle.paddingVertical = spacing.sm + 4;
        baseStyle.paddingHorizontal = spacing.md + 4;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled ? colors.quaternaryText : colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.secondaryBackground;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.separator;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...typography.body,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        baseStyle.color = '#FFFFFF';
        break;
      case 'secondary':
      case 'text':
        baseStyle.color = disabled ? colors.tertiaryText : colors.primary;
        break;
    }

    if (size === 'small') {
      baseStyle.fontSize = 15;
    } else if (size === 'large') {
      baseStyle.fontSize = 18;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
