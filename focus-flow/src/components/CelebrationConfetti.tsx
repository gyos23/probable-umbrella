import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { haptics } from '../utils/haptics';

interface CelebrationConfettiProps {
  trigger: boolean;
  onAnimationEnd?: () => void;
}

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({
  trigger,
  onAnimationEnd,
}) => {
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (trigger) {
      // Trigger celebration haptic feedback (automatically handles web)
      haptics.celebration();

      // Start confetti
      confettiRef.current?.start();

      // Call onAnimationEnd after confetti duration
      if (onAnimationEnd) {
        setTimeout(onAnimationEnd, 3000);
      }
    }
  }, [trigger, onAnimationEnd]);

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: -10, y: 0 }}
        fadeOut={true}
        autoStart={false}
        fallSpeed={2500}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
