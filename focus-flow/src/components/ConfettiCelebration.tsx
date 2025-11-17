import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger,
  onComplete,
}) => {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (trigger && confettiRef.current) {
      confettiRef.current.start();

      // Call onComplete after animation
      if (onComplete) {
        setTimeout(onComplete, 2500);
      }
    }
  }, [trigger, onComplete]);

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        explosionSpeed={350}
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
    zIndex: 9999,
  },
});
