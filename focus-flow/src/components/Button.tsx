import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
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
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

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
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
