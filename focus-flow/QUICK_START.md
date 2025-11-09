# Quick Start - Test on iPhone

## 5-Minute Setup

### Step 1: Install Expo Go on iPhone
1. Open **App Store**
2. Search **"Expo Go"**
3. Install (free app from Expo)

### Step 2: Start the App
On your computer, in the `focus-flow` folder:

```bash
npm start
```

You should see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 3: Connect Your iPhone
**Two ways to connect:**

#### Method A: QR Code (Easiest)
1. Open **Camera app** on iPhone
2. Point at the QR code in your terminal
3. Tap the notification banner
4. App opens in Expo Go!

#### Method B: Same WiFi Network
1. Make sure iPhone and computer are on same WiFi
2. In Expo Go app, tap "Enter URL manually"
3. Type the URL shown in terminal (exp://192.168.x.x:8081)
4. Tap "Connect"

### Troubleshooting

**QR Code doesn't work?**
- Ensure iPhone and computer on same WiFi network
- Try the manual URL method instead

**"Unable to connect"?**
```bash
# Try tunnel mode instead
npm start -- --tunnel
```

**Want to reload the app?**
- Shake your iPhone
- Tap "Reload" in the menu

### What You'll See

The app will open and you can:
- ✅ Create tasks and projects
- ✅ Use the daily planning wizard
- ✅ Set up recurring tasks
- ✅ Flag important tasks
- ✅ Create SMART goals
- ✅ Feel haptic feedback
- ✅ Test all features in real-time

### Live Development

Any changes you make to the code will automatically refresh on your iPhone!

1. Edit a file in VS Code
2. Save
3. Watch it update on your iPhone instantly

### To Stop

Press `Ctrl+C` in the terminal where `npm start` is running

---

## Next: Building for TestFlight

Want to install it permanently on your iPhone without the dev server running?

1. Create Expo account: https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Build: `eas build --profile development --platform ios`
4. Install via link sent to your email
5. App stays on your phone!

---

## Quick Demo Video Idea

If you want to show off the app:
1. Screen record on iPhone (swipe down, tap record button)
2. Open the app in Expo Go
3. Demo the features:
   - Daily planning wizard
   - Create a recurring task
   - Flag some tasks
   - Create a SMART goal project
4. Share the video!

The app looks completely native - most people won't know it's running in Expo Go!
