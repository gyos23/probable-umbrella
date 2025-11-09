# Focus Flow - Deployment Guide

## Current Status
Focus Flow is a React Native app built with Expo that can be deployed to iOS and Android.

## Building for iOS

### Prerequisites
1. macOS with Xcode installed
2. Apple Developer Account ($99/year)
3. EAS CLI: `npm install -g eas-cli`

### Build Steps

```bash
# 1. Login to Expo
eas login

# 2. Configure EAS Build
eas build:configure

# 3. Build for iOS
eas build --platform ios --profile production

# 4. Submit to App Store
eas submit --platform ios
```

## Running on Your iPhone (Development)

### Option 1: Expo Go (Easiest)
```bash
# Start the development server
npm start

# Scan QR code with iPhone Camera app
# Opens in Expo Go app (free download)
```

**Limitations**: Cannot use custom native modules, notifications won't work fully

### Option 2: Development Build (Recommended)
```bash
# Create custom development client
eas build --profile development --platform ios

# Install on your device via TestFlight or direct download
# Then run:
npm start --dev-client
```

**Benefits**: Full native features, notifications, all APIs work

### Option 3: Physical Build
```bash
# Create production build
eas build --profile production --platform ios

# Download IPA and install via Xcode or TestFlight
```

## Adding Notifications

### 1. Install Dependencies
```bash
npx expo install expo-notifications expo-device
```

### 2. Configure app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#007AFF",
      "iosDisplayInForeground": true
    }
  }
}
```

### 3. Request Permissions
Create `src/utils/notifications.ts` with permission handling

### 4. Schedule Notifications
- Task due date reminders
- Daily planning prompts
- Recurring task notifications

## Adding Siri Shortcuts

### 1. Configure Intent Definitions
Create `Intents.intentdefinition` file in Xcode

### 2. Add to app.json
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserActivityTypes": [
          "AddTaskIntent",
          "ShowTodayTasksIntent"
        ]
      }
    }
  }
}
```

### 3. Implement Handlers
Handle Siri shortcuts in app code

## Adding Widgets

Requires native Swift code:
1. Create Widget Extension in Xcode
2. Use WidgetKit framework
3. Share data via App Groups
4. Update widget timeline

## App Store Submission Checklist

- [ ] App Icon (1024x1024)
- [ ] Launch Screen
- [ ] Screenshots (all required sizes)
- [ ] App Preview videos
- [ ] Privacy Policy URL
- [ ] App Description
- [ ] Keywords
- [ ] Support URL
- [ ] Marketing URL
- [ ] Age Rating
- [ ] App Store Connect account setup
- [ ] TestFlight beta testing
- [ ] App Review submission

## Current Limitations

**What Works:**
- ✅ All task management features
- ✅ Offline-first with AsyncStorage
- ✅ Haptic feedback
- ✅ Accessibility
- ✅ iOS-native feel

**What Needs Native Development:**
- ❌ Push notifications (can add with expo-notifications)
- ❌ Siri integration (needs native module)
- ❌ Widgets (needs native Swift)
- ❌ Apple Watch (separate watchOS app)
- ❌ iCloud sync (needs CloudKit)
- ❌ Background app refresh

## Next Steps to Production

### Phase 1: Core Native Features (1-2 weeks)
1. Add expo-notifications
2. Implement local notifications for tasks
3. Add notification permissions flow
4. Test on physical device

### Phase 2: App Store Preparation (1 week)
1. Design app icon
2. Create launch screen
3. Take screenshots
4. Write app description
5. Set up App Store Connect

### Phase 3: Beta Testing (1-2 weeks)
1. TestFlight distribution
2. Gather feedback
3. Fix bugs
4. Iterate

### Phase 4: Advanced Features (2-4 weeks)
1. Widgets
2. Siri Shortcuts
3. Apple Watch
4. iCloud sync

## Running Locally Now

To test the current app on your iPhone:

```bash
# In the focus-flow directory
npm start

# Choose "Run on iOS" or scan QR code
# Install Expo Go app first from App Store
```

## Estimated Timeline to App Store

- **Minimal version** (current features + notifications): 2-3 weeks
- **Full native experience** (widgets, Siri, Watch): 2-3 months
- **Apple Design Award quality**: 4-6 months

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
