import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text, ...typography.title2 }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.secondaryText, ...typography.body }]}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.buttonText, { ...typography.body }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingVertical: 80,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
