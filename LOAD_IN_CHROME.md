# 🚀 Load Your Extension in Chrome - Quick Guide

## ✅ Status: Ready to Deploy!

Your extension has been built successfully and is ready to load in Chrome.

---

## 📍 Step-by-Step Chrome Installation

### 1. Open Chrome Extensions Page

Choose one method:
- **Method A:** Type in address bar: `chrome://extensions/`
- **Method B:** Click Menu (⋮) → Extensions → Manage Extensions

### 2. Enable Developer Mode

- Look for the toggle switch in the **top-right corner**
- Click to turn it **ON** (it should turn blue)

### 3. Load Your Extension

- Click the **"Load unpacked"** button (top-left area)
- A file browser will open
- Navigate to: `/Users/dreytech/Projects/Trex/s_frontend/dist`
- Click **"Select"** or **"Open"**

### 4. Verify Installation

You should now see:
- ✅ "Media NFT Tracker" in your extensions list
- ✅ Version 1.0.0
- ✅ Your beautiful gradient icon
- ✅ "Enabled" status

### 5. Pin the Extension (Optional but Recommended)

- Click the **puzzle piece icon (🧩)** in Chrome toolbar
- Find "Media NFT Tracker"
- Click the **pin icon** to keep it visible

---

## 🎯 Using Your Extension

### Access Methods:

**1. Popup Window:**
- Click the extension icon in toolbar
- Small quick-access popup appears

**2. Dashboard (Full Experience):**
- Click extension icon
- Then click "Open Dashboard" or
- Right-click icon → Options
- Beautiful full-screen interface opens

**3. Settings:**
- Right-click extension icon → Options
- Configure privacy settings

---

## 🧪 Test Checklist

Test these features:

### ✅ Visual Check
- [ ] Icons display correctly
- [ ] Modern gradient UI loads
- [ ] All pages are styled beautifully

### ✅ Functionality
- [ ] Wallet connect button works
- [ ] Add media modal opens
- [ ] Media tracking displays
- [ ] Navigation between tabs works
- [ ] Settings toggles function

### ✅ Pages to Test
- [ ] Dashboard (main page)
- [ ] Track Media tab
- [ ] My NFTs tab
- [ ] Find Users tab
- [ ] Settings tab

---

## 🔄 Making Updates

When you modify code:

1. **Save your changes**
2. **Rebuild:**
   ```bash
   cd /Users/dreytech/Projects/Trex/s_frontend
   pnpm run build
   ```
3. **Reload in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Media NFT Tracker"
   - Click the **refresh icon (🔄)**

---

## 🐛 Debugging

### View Console Logs:

**Popup:**
- Right-click popup → Inspect
- DevTools opens

**Background Service Worker:**
- `chrome://extensions/`
- Click "service worker" link

**Dashboard:**
- Open dashboard
- Press **F12** or Right-click → Inspect

### Common Issues:

**Extension won't load:**
- ✓ Make sure you selected the `dist` folder, not `s_frontend`
- ✓ Check for manifest errors displayed in Chrome
- ✓ Verify all icon files exist in `dist/icons/`

**Changes not showing:**
- ✓ Did you rebuild? (`pnpm run build`)
- ✓ Did you click refresh in chrome://extensions/?
- ✓ Try removing and re-adding the extension

**Icons not displaying:**
- ✓ Check `dist/icons/` folder has all PNG files
- ✓ Rebuild the extension

---

## 📸 Take Screenshots (For Chrome Web Store Later)

Capture these screens for publishing:

1. **Dashboard** - Main page with gradient header
2. **Media Tracking** - Add media and tracking cards
3. **NFT Gallery** - With some NFT cards
4. **Settings Page** - Privacy toggles
5. **Extension Popup** - Small popup view

**How to capture:**
- Press **F12** → Console → Click **"..."** → Capture screenshot
- Or use macOS: **Cmd+Shift+4**

Recommended size: **1280x800** or **640x400**

---

## 🌐 Next Steps: Publishing to Chrome Web Store

When ready to share with the world:

### Requirements:
- ✅ Working extension (you have this!)
- ✅ Screenshots (5 max, 1 min)
- ✅ Promotional image 440x280 (optional)
- ✅ Detailed description
- 💵 $5 USD one-time developer fee

### Process:
1. Visit: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with Google account
3. Pay $5 developer registration fee
4. Create ZIP of dist folder:
   ```bash
   cd dist
   zip -r ../media-nft-tracker.zip .
   ```
5. Upload ZIP
6. Fill in store listing details
7. Upload screenshots
8. Submit for review

**Review time:** Usually 1-3 business days

---

## ✨ Your Extension Features

What users will get:

- 🎨 **Stunning Modern UI** - Gradient purple/pink theme with glassmorphism
- 💎 **NFT Tracking** - Track media and earn NFTs
- 🔗 **Casper Integration** - Connect Casper wallet
- 📊 **Media Management** - Track movies, shows, books, anime, manga, comics
- ⚙️ **Privacy Controls** - Choose what to track
- 🎯 **Auto-mint** - Automatic NFT minting on completion

---

## 🎉 You're Ready!

Your extension is built and ready to use. Load it in Chrome and enjoy!

**Current Build Location:**
```
/Users/dreytech/Projects/Trex/s_frontend/dist
```

Need help? Check the browser console for error messages!
