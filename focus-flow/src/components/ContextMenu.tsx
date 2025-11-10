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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

  // Constants for menu sizing
  const MENU_WIDTH = 240;
  const MENU_ITEM_HEIGHT = 52;
  const MENU_PADDING = 8;
  const MAX_VISIBLE_ITEMS = 6; // Show max 6 items before scrolling

  // Calculate available space accounting for safe areas
  const availableHeight = screenHeight - insets.top - insets.bottom - 40; // 40px margin
  const idealMenuHeight = items.length * MENU_ITEM_HEIGHT + MENU_PADDING * 2;
  const maxMenuHeight = Math.min(
    idealMenuHeight,
    MAX_VISIBLE_ITEMS * MENU_ITEM_HEIGHT + MENU_PADDING * 2,
    availableHeight
  );

  // Calculate menu position - center on screen with safe area consideration
  const menuTop = Math.max(
    insets.top + 20,
    (screenHeight - maxMenuHeight) / 2
  );

  const menuLeft = (screenWidth - MENU_WIDTH) / 2;

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
              width: MENU_WIDTH,
              maxHeight: maxMenuHeight,
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
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={items.length > MAX_VISIBLE_ITEMS}
            bounces={items.length > MAX_VISIBLE_ITEMS}
          >
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { minHeight: MENU_ITEM_HEIGHT },
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
          </ScrollView>
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    flex: 1,
  },
  separator: {
    height: 0.5,
    marginHorizontal: 16,
  },
});
