import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors, typography } = useTheme();

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message}`}
    >
      <Text style={styles.emoji} accessible={false} aria-hidden={true}>
        {emoji}
      </Text>
      <Text
        style={[styles.title, { color: colors.text, ...typography.title2 }]}
        accessible={false}
      >
        {title}
      </Text>
      <Text
        style={[styles.message, { color: colors.secondaryText, ...typography.body }]}
        accessible={false}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleAction}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { ...typography.body }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
