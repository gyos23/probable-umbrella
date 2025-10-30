# 📱 iOS Deployment Checklist

Use this checklist to track your progress deploying to the App Store!

---

## ✅ Pre-Deployment Setup

- [ ] **Mac computer access**
  - Own one
  - Borrowed one
  - Cloud Mac rental
  - Using EAS Build (no Mac needed!)

- [ ] **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com/programs/
  - Account approved (takes 1-2 days)

- [ ] **Expo Account** (free)
  - Sign up at: https://expo.dev/signup

- [ ] **Install required tools:**
  ```bash
  npm install -g eas-cli
  ```

---

## 🛠️ Configuration

- [ ] **Run EAS configuration:**
  ```bash
  cd focus-flow
  eas build:configure
  ```

- [ ] **Create app.json configuration**
  - App name set
  - Bundle identifier set (com.yourname.focusflow)
  - Version number set (1.0.0)
  - Build number set (1)

- [ ] **Test build locally (optional):**
  ```bash
  npm run ios
  ```

---

## 🎨 App Store Assets

- [ ] **App Icon**
  - 1024x1024 PNG
  - No transparency
  - No rounded corners (Apple adds them)
  - Save as: `app-icon.png`

- [ ] **Screenshots** (need at least 2)
  - iPhone 15 Pro Max (6.7") - Required
  - iPhone 14 Plus (6.5") - Required
  - iPad Pro (12.9") - Optional
  - Take screenshots from simulator or real device

- [ ] **App Description**
  - Short description (max 170 characters)
  - Full description (max 4000 characters)
  - What's new in this version (max 4000 characters)

- [ ] **Keywords**
  - Max 100 characters
  - Comma-separated
  - Example: "tasks,todo,productivity,gtd,projects,focus"

- [ ] **Privacy Policy**
  - Create at: https://www.privacypolicygenerator.info/
  - Host somewhere (GitHub Pages, your website, etc.)
  - Get URL

- [ ] **Support URL**
  - Where users can get help
  - Can be email like: support@yourapp.com
  - Or GitHub issues page

---

## 🏗️ Build Your App

- [ ] **First production build:**
  ```bash
  eas build --platform ios
  ```
  ⏰ Takes 10-30 minutes

- [ ] **Download .ipa file** (optional, for testing)

- [ ] **Test on real device** (via TestFlight)

---

## 📤 App Store Connect Setup

- [ ] **Go to:** https://appstoreconnect.apple.com

- [ ] **Create new app:**
  - Click "My Apps" → "+" → "New App"
  - Name: Focus Flow
  - Primary Language: English
  - Bundle ID: (same as in app.json)
  - SKU: focusflow001 (can be anything)

- [ ] **Fill out App Information:**
  - Category: Productivity
  - Subtitle (optional): "Stay focused, get things done"

- [ ] **Upload screenshots**

- [ ] **Upload app icon**

- [ ] **Set pricing:**
  - Free or Paid
  - Availability: All countries

- [ ] **Add privacy policy URL**

- [ ] **Add support URL**

- [ ] **Fill out age rating questionnaire**

---

## 🚀 Submit for Review

- [ ] **Upload build to App Store Connect:**
  ```bash
  eas submit --platform ios
  ```

- [ ] **In App Store Connect:**
  - Select your build
  - Click "Save"
  - Click "Submit for Review"

- [ ] **Answer review questions:**
  - Does your app use encryption? Usually "No"
  - Advertising identifier? Usually "No"

- [ ] **Submit!** 🎉

---

## ⏰ Wait for Review

- [ ] **Check email daily** (Apple might have questions)

- [ ] **Review status:**
  - "Waiting for Review" → In queue
  - "In Review" → Being tested (usually 1-2 hours)
  - "Pending Developer Release" → Approved! ✅
  - "Ready for Sale" → Live in App Store! 🎉

**Typical timeline:** 1-7 days (usually 1-2 days)

---

## 🎊 Post-Approval

- [ ] **Release your app:**
  - Manual: Click "Release this version"
  - Or set to auto-release when approved

- [ ] **Verify it's live:**
  - Search App Store for your app
  - Check the link works

- [ ] **Share with the world!**
  - App Store link: https://apps.apple.com/app/your-app-id
  - Social media
  - Friends and family
  - Submit to Product Hunt
  - Submit to Apple Design Awards! 🏆

---

## 🔄 Future Updates

When you want to release an update:

1. [ ] Update version number in `app.json`
2. [ ] Run `eas build --platform ios`
3. [ ] Submit new build
4. [ ] Repeat review process (usually faster for updates)

---

## 🆘 Getting Help

**If you get stuck:**

1. **Expo Docs:** https://docs.expo.dev/submit/ios/
2. **Expo Discord:** https://discord.gg/expo
3. **Apple Developer Forums:** https://developer.apple.com/forums/
4. **Stack Overflow:** Tag with `expo` and `react-native`

---

## 📞 Important Contacts

**Apple Developer Support:**
- Phone: 1-800-633-2152 (US)
- Email: developer.apple.com/contact

**Expo Support:**
- Discord: https://discord.gg/expo
- Forums: https://forums.expo.dev/

---

## 💡 Pro Tips

✅ **Test on TestFlight first!**
- Apple lets you test with 10,000 beta testers
- Find bugs before public release
- Get feedback from friends

✅ **Prepare rejection response**
- ~40% of apps get rejected first time
- It's normal! Just fix and resubmit
- Usually minor issues

✅ **Set up automatic updates**
- Update app regularly (monthly is good)
- Shows Apple you're actively maintaining it
- Better for Design Award consideration

✅ **Monitor reviews**
- Respond to user reviews
- Fix reported bugs quickly
- Shows you care about users

---

## 🏆 Apple Design Award Specific

If submitting for Design Awards:

- [ ] App must be on App Store (public or pre-release)
- [ ] Submission window: Usually April-May
- [ ] Announcement: WWDC in June
- [ ] Make sure all accessibility features work perfectly
- [ ] Record demo video showcasing features
- [ ] Prepare case study explaining design decisions

**Submission:** https://developer.apple.com/design/awards/

---

Good luck! You've got this! 🚀
