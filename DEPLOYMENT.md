# 🚀 Media NFT Tracker - Deployment Guide

## 📦 Step 1: Generate Icon Files

1. Open the icon generator in your browser:
   ```bash
   open public/icons/generate-icons.html
   ```
   Or navigate to: `http://localhost:5174/icons/generate-icons.html`

2. The page will auto-generate all icon sizes
3. Right-click each icon and save as:
   - `icon-16.png`
   - `icon-32.png`
   - `icon-48.png`
   - `icon-128.png`
4. Save all files in the `public/icons/` folder

## 🔨 Step 2: Build the Extension

Run the build command:
```bash
cd s_frontend
pnpm run build
```

This will create a `dist` folder with all your extension files.

## 📂 Step 3: Prepare for Chrome

After building, your extension files are in the `dist` folder with this structure:
```
dist/
├── icons/              # Icon files
├── src/
│   ├── popup/
│   │   └── index.html
│   ├── dashboard/
│   │   └── index.html
│   ├── options/
│   │   └── index.html
│   ├── background/
│   └── content/
├── manifest.json       # Chrome extension manifest
└── *.js, *.css files  # Bundled assets
```

## 🌐 Step 4: Load Extension in Chrome (Development Mode)

### Method 1: Chrome Developer Mode

1. **Open Chrome Extensions Page:**
   - Go to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Your Extension:**
   - Click "Load unpacked"
   - Select the `dist` folder from your project
   - Your extension should now appear in the list!

4. **Pin the Extension:**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Media NFT Tracker"
   - Click the pin icon to keep it visible

5. **Test the Extension:**
   - Click the extension icon to open the popup
   - Go to options (right-click icon → Options)
   - Visit the dashboard page

### Method 2: Using npm script (if configured)

```bash
# Watch mode - rebuilds on changes
pnpm run dev

# Build for production
pnpm run build:extension
```

## 🔄 Step 5: Update and Reload

When you make changes:

1. **Rebuild the extension:**
   ```bash
   pnpm run build
   ```

2. **Reload in Chrome:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click the refresh icon (🔄)

## 📊 Step 6: Testing Your Extension

### Test the Dashboard:
1. Click the extension icon
2. Click "Connect Wallet" 
3. Add media to track
4. Complete media to mint NFTs
5. View your NFT gallery

### Test on Different Sites:
- Visit Netflix, YouTube, etc.
- The content script should detect media
- Check the console for any errors

### Test Privacy Settings:
- Right-click extension → Options
- Toggle different media types
- Check that settings persist

## 🎯 Step 7: Production Deployment to Chrome Web Store

When ready to publish:

### 1. Create a Production Build
```bash
pnpm run build:extension
```

### 2. Create a ZIP file
```bash
cd dist
zip -r media-nft-tracker.zip .
```

### 3. Prepare Store Assets

**Required items:**
- 📷 Screenshots (1280x800 or 640x400) - at least 1, max 5
- 🎨 Promo image (440x280) - optional
- 📝 Detailed description (132 characters min)
- 🏷️ Category selection
- 💰 One-time developer fee: $5 USD

### 4. Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the $5 developer fee (one-time)
4. Click "New Item"
5. Upload your ZIP file
6. Fill in store listing:
   - **Title:** Media NFT Tracker
   - **Summary:** Track media and earn NFTs on Casper
   - **Description:** Your detailed description
   - **Category:** Entertainment or Productivity
7. Upload screenshots and promotional images
8. Submit for review

**Review time:** Usually 1-3 days

## 🛠️ Development Tips

### Hot Reload (Development)
```bash
# Terminal 1: Start dev server
pnpm run dev

# Terminal 2: Watch for changes (if you set up watch mode)
pnpm run watch
```

### Debug Issues
- Open Chrome DevTools in popup: Right-click popup → Inspect
- View background logs: chrome://extensions → Details → Inspect views: service worker
- Console logs in content script: Open DevTools on any webpage

### Common Issues

**Issue:** Icons not showing
- **Fix:** Make sure icon files exist in `dist/icons/`

**Issue:** Manifest errors
- **Fix:** Validate manifest at chrome://extensions/

**Issue:** Content script not injecting
- **Fix:** Check permissions in manifest.json

**Issue:** Storage not persisting
- **Fix:** Ensure storage permission is granted

## 📱 Optional: Firefox Extension

To support Firefox:

1. Create `manifest-firefox.json` with Firefox-specific changes
2. Build: `pnpm run build:firefox`
3. Load in Firefox: `about:debugging` → This Firefox → Load Temporary Add-on

## 🎉 You're Ready!

Your extension is now:
- ✅ Built with modern UI
- ✅ Has beautiful icons
- ✅ Ready for Chrome
- ✅ Ready for production deployment

Need help? Check the console logs or extension error page in Chrome!
