import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../theme/useTheme';
import { haptics } from '../utils/haptics';

interface SwipeableTaskRowProps {
  onComplete: () => void;
  onDefer?: () => void;
  children: React.ReactNode;
}

export const SwipeableTaskRow: React.FC<SwipeableTaskRowProps> = ({
  onComplete,
  onDefer,
  children,
}) => {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View
          style={[
            styles.rightAction,
            {
              backgroundColor: colors.green,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Text style={styles.actionText}>✓ Complete</Text>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    if (!onDefer) return null;

    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActionsContainer}>
        <Animated.View
          style={[
            styles.leftAction,
            {
              backgroundColor: colors.orange,
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Text style={styles.actionText}>⏰ Defer</Text>
        </Animated.View>
      </View>
    );
  };

  const handleSwipeRight = () => {
    haptics.success();
    setTimeout(() => {
      swipeableRef.current?.close();
      if (onDefer) onDefer();
    }, 100);
  };

  const handleSwipeLeft = () => {
    haptics.success();
    setTimeout(() => {
      swipeableRef.current?.close();
      onComplete();
    }, 100);
  };

  if (Platform.OS === 'web') {
    // Web doesn't support swipe gestures well, just render children
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={80}
      rightThreshold={80}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          handleSwipeRight();
        } else if (direction === 'left') {
          handleSwipeLeft();
        }
      }}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
  },
  leftActionsContainer: {
    flexDirection: 'row',
  },
  rightAction: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  leftAction: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
