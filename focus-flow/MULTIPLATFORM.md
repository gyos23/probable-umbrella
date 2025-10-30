# Multi-Platform Support Guide

Focus Flow is built with **React Native, Expo, and React Native Web**, enabling deployment to **iOS, Android, and Web** from a single codebase.

---

## 🚀 Running on Different Platforms

### iOS
```bash
npm run ios
```
Launches in iOS Simulator (requires macOS + Xcode)

### Android
```bash
npm run android
```
Launches in Android Emulator (requires Android Studio)

### Web
```bash
npm run web
```
Opens in your default browser at `http://localhost:19006`

### Production Web Build
```bash
npm run build
```
Exports static web build to `dist/` directory

---

## 📱 Platform-Specific Features

### Features That Work on All Platforms

✅ **Full cross-platform support:**
- All UI components (View, Text, TouchableOpacity, etc.)
- Navigation (Expo Router)
- State management (Zustand)
- AsyncStorage for data persistence
- Theme system (light/dark mode, dynamic typography)
- Styling with StyleSheet
- Animations (Reanimated 3)
- Swipe gestures (works with mouse on web)
- Confetti celebrations

### Features That Are Native-Only (iOS/Android)

⚠️ **Requires physical device or native emulator:**
- **Haptic feedback** - Tactile vibrations (handled gracefully via `src/utils/haptics.ts`)
- **VoiceOver/TalkBack** - Screen readers (web has native screen readers)
- **Widgets** - Home screen widgets
- **Live Activities** - iOS 16.1+ dynamic island/lock screen widgets
- **Siri Shortcuts** - Voice commands
- **Dynamic Type** - Native font scaling (web uses browser zoom)

### Features That Work Differently

🔄 **Platform-adapted behavior:**
- **Accessibility**: Native screen readers vs web screen readers (both supported)
- **Pull-to-refresh**: Natural on mobile, works on web but less intuitive
- **Safe areas**: iOS notch/home indicator handling
- **Platform-specific styling**: Can adjust spacing, sizing per platform

---

## 🛠️ How We Handle Platform Differences

### 1. Haptics Utility

We created a cross-platform haptics helper (`src/utils/haptics.ts`) that safely handles web:

```typescript
import { haptics } from '../utils/haptics';

// Automatically checks if platform supports haptics
haptics.light();    // Button taps
haptics.medium();   // Important actions
haptics.success();  // Task completed
haptics.warning();  // Delete actions
```

**Implementation:**
```typescript
// src/utils/haptics.ts
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Silently does nothing on web
  },
  // ... more methods
};
```

### 2. Platform-Specific Checks

Use React Native's `Platform` API when needed:

```typescript
import { Platform } from 'react-native';

// Check platform type
if (Platform.OS === 'web') {
  // Web-specific code
} else if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}

// Select values per platform
const padding = Platform.select({
  ios: 12,
  android: 12,
  web: 16,
  default: 12
});
```

### 3. Platform-Specific Files

Expo automatically loads platform-specific files:

```
Button.tsx          → Default/shared implementation
Button.ios.tsx      → iOS-specific overrides
Button.android.tsx  → Android-specific overrides
Button.web.tsx      → Web-specific overrides
```

The bundler automatically picks the most specific file for the target platform.

---

## 🎨 Styling Considerations

### Responsive Web Design

On web, you may want to adjust layouts for larger screens:

```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const styles = StyleSheet.create({
  container: {
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: 'center',
  }
});
```

### Web-Specific CSS

For advanced web styling, you can use platform-specific stylesheets:

```typescript
// styles.web.ts
export const webOnlyStyles = {
  cursor: 'pointer',
  userSelect: 'none',
};
```

---

## 🧪 Testing Across Platforms

### Testing Checklist

When adding new features, test on all platforms:

- [ ] **iOS**: Simulator + real device (for haptics, camera, etc.)
- [ ] **Android**: Emulator + real device
- [ ] **Web**: Chrome, Safari, Firefox
- [ ] **Accessibility**: VoiceOver (iOS), TalkBack (Android), screen readers (web)
- [ ] **Responsive**: Mobile, tablet, desktop sizes
- [ ] **Dark mode**: All platforms

### Common Gotchas

1. **Haptics don't work on web** ✅ Handled via haptics utility
2. **AsyncStorage on web** → Uses localStorage (works automatically)
3. **Safe area on web** → No notches, but SafeAreaView still works
4. **Animations** → Performance may vary; test on low-end devices
5. **Touch vs click** → React Native abstracts this, but UX differs

---

## 📦 Dependencies

### Cross-Platform
- `expo` - Universal app framework
- `react` / `react-native` - UI framework
- `react-native-web` - Web compatibility layer
- `expo-router` - File-based routing
- `zustand` - State management

### Native-Enhanced (graceful degradation on web)
- `expo-haptics` - Haptic feedback (iOS/Android only)
- `react-native-gesture-handler` - Advanced gestures
- `react-native-reanimated` - High-performance animations
- `react-native-confetti-cannon` - Celebrations (works on web!)

---

## 🌐 Web Deployment Options

### Vercel (Recommended)
```bash
npm run vercel-build
```
Configured in `vercel.json` (if present) or via Vercel dashboard

### Netlify
```bash
npm run build
# Deploy dist/ folder
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

### Custom Server
```bash
npm run build
# Serve dist/ with any static file server
```

---

## 🎯 Best Practices

### 1. Design for Mobile First
Start with mobile UX, then enhance for larger screens:
```typescript
const containerStyle = Platform.select({
  default: styles.mobileContainer,
  web: width > 768 ? styles.desktopContainer : styles.mobileContainer
});
```

### 2. Feature Detection Over Platform Checks
Instead of checking `Platform.OS`, check if features exist:
```typescript
// ✅ Good
const supportsHaptics = Platform.OS !== 'web';

// Better
try {
  haptics.light(); // Our utility handles this
} catch (e) {
  // Fallback
}
```

### 3. Accessibility First
Use semantic elements that work across platforms:
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add task"
>
  {/* Content */}
</TouchableOpacity>
```

### 4. Test Early and Often
Don't wait until the end to test all platforms. Check regularly:
```bash
# Quick cross-platform test routine
npm run web &    # Start web
npm run ios &    # Start iOS
npm run android  # Start Android
```

---

## 🚀 Future Multi-Platform Features

### Planned Enhancements

1. **Progressive Web App (PWA)**
   - Add `manifest.json`
   - Service worker for offline support
   - Install prompt on mobile web

2. **Platform-Optimized Builds**
   - iOS: Widgets, Live Activities, Siri Shortcuts
   - Android: Widgets, Quick Settings tiles
   - Web: Keyboard shortcuts, desktop notifications

3. **Responsive Layouts**
   - Split-view on tablets
   - Multi-column layout on desktop web
   - Adaptive navigation (tabs mobile, sidebar desktop)

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

## 🆘 Troubleshooting

### "Haptics not working on web"
✅ Expected behavior - haptics only work on iOS/Android devices with haptic engines. Our utility silently handles this.

### "Layout looks different on web"
Check for:
- Safe area insets (not needed on web)
- Touch target sizes (larger on mobile)
- ScrollView behavior differences

### "Can't install on iPhone/Android"
Web version runs in browser. For native apps, you need to:
1. Build with EAS Build: `eas build`
2. Or run development build: `npx expo run:ios/android`

---

## ✅ Current Platform Status

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Core UI | ✅ | ✅ | ✅ |
| Navigation | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ✅ | ✅ |
| Haptics | ✅ | ✅ | ➖ (graceful) |
| Swipe Gestures | ✅ | ✅ | ✅ |
| Pull-to-Refresh | ✅ | ✅ | ✅ |
| Animations | ✅ | ✅ | ✅ |
| Accessibility | ✅ | ✅ | ✅ |
| Dynamic Type | ✅ | ✅ | ➖ (browser zoom) |
| Reduced Motion | ✅ | ✅ | ✅ |

Legend: ✅ Full support | ➖ Partial/adapted | ❌ Not supported

---

**Your app works beautifully across all platforms! 🎉**
