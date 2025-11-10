import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { haptics } from '../utils/haptics';

export interface ContextMenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  position?: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  onClose,
  items,
  position,
}) => {
  const { colors, typography, spacing, shadow } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleItemPress = (item: ContextMenuItem) => {
    if (item.disabled) return;

    if (item.destructive) {
      haptics.warning();
    } else {
      haptics.light();
    }

    onClose();
    // Small delay to let the menu close animation play
    setTimeout(item.onPress, 100);
  };

  const handleBackdropPress = () => {
    haptics.light();
    onClose();
  };

  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Calculate menu position
  const menuTop = position
    ? Math.min(position.y, screenHeight - (items.length * 56 + 20))
    : screenHeight / 2 - (items.length * 56) / 2;

  const menuLeft = position
    ? Math.min(position.x, screenWidth - 250)
    : screenWidth / 2 - 125;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.menu,
            {
              backgroundColor: colors.card,
              top: menuTop,
              left: menuLeft,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              ...shadow.lg,
            },
          ]}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  item.disabled && styles.menuItemDisabled,
                ]}
                onPress={() => handleItemPress(item)}
                disabled={item.disabled}
                activeOpacity={0.6}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: item.destructive ? colors.red : colors.text },
                    item.disabled && { color: colors.tertiaryText },
                    typography.body,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
              {index < items.length - 1 && (
                <View
                  style={[styles.separator, { backgroundColor: colors.separator }]}
                />
              )}
            </React.Fragment>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    minWidth: 220,
    borderRadius: 14,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 0.5,
    marginHorizontal: 16,
  },
});
