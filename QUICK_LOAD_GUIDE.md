# 🎨 Quick Start: Load Your Extension in Chrome

## Step 1: Generate Icons (You're here now!)

You should see the icon generator page open. Follow these steps:

1. ✅ Icons are auto-generated when the page loads
2. 📥 Right-click each icon preview
3. 💾 Select "Save Image As..."
4. 📝 Save with exact names in `s_frontend/public/icons/`:
   - `icon-16.png`
   - `icon-32.png`
   - `icon-48.png`
   - `icon-128.png`

## Step 2: Rebuild (After Saving Icons)

Run in terminal:
```bash
cd s_frontend
pnpm run build
```

## Step 3: Load in Chrome

### Quick Steps:

1. **Open Chrome Extensions:**
   - Type in address bar: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Find the toggle switch in the top-right
   - Turn it ON (blue)

3. **Load Your Extension:**
   - Click the "Load unpacked" button
   - Navigate to and select: `s_frontend/dist` folder
   - Click "Select"

4. **Pin the Extension:**
   - Look for the puzzle piece icon (🧩) in Chrome toolbar
   - Click it to see your extensions
   - Find "Media NFT Tracker"
   - Click the pin icon to keep it visible

## Step 4: Use Your Extension!

### Access Methods:

**1. Popup (Quick Access):**
- Click the extension icon in the toolbar
- Small popup window appears

**2. Dashboard (Full Experience):**
- Click extension icon → "Open Dashboard" or
- Right-click icon → Options
- Full-screen beautiful interface

**3. Options Page:**
- Right-click icon → Options
- Configure privacy settings

## 🎯 What to Test:

### ✅ Wallet Connection
- Click "Connect Wallet" 
- (Note: You'll need Casper Signer extension for real wallet)

### ✅ Add Media
- Click "Add Media to Track"
- Enter a movie/book/show name
- Select type
- See it in your tracked list

### ✅ Complete Media
- Click "Complete" on a tracked item
- Watch the progress bar fill
- NFT minting simulation

### ✅ View NFTs
- Go to "My NFTs" tab
- See your earned NFTs with beautiful cards

### ✅ Settings
- Go to "Settings" tab
- Toggle different media types
- Enable/disable auto-mint

## 🔄 Making Changes

When you update code:

1. **Save your changes**
2. **Rebuild:**
   ```bash
   pnpm run build
   ```
3. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click the refresh icon (🔄)

## 🐛 Debugging

### View Console Logs:

**Popup:**
- Right-click on popup → Inspect
- DevTools opens for popup

**Background Service:**
- Go to `chrome://extensions/`
- Find your extension
- Click "service worker" link under "Inspect views"

**Dashboard:**
- Open dashboard
- Press F12 or Right-click → Inspect
- Regular DevTools

### Common Issues:

**Icons not showing:**
- Make sure PNG files are in `public/icons/`
- Rebuild after adding icons

**Extension won't load:**
- Check for manifest errors in Chrome
- Make sure you selected the `dist` folder

**Changes not showing:**
- Remember to rebuild (`pnpm run build`)
- Click refresh in chrome://extensions/

## 🚀 Next Steps

Once everything works:

1. Test on different websites
2. Verify all features work
3. Take screenshots for Chrome Web Store
4. Follow DEPLOYMENT.md for publishing

## 📸 Screenshot Tips for Store

Capture these screens:
1. Dashboard with wallet connected
2. Media tracking in action
3. NFT gallery with items
4. Privacy settings page
5. Extension popup

Use Chrome's built-in screenshot tool:
- F12 → Console → Click "..." → Capture screenshot

---

**Need Help?** Check the browser console (F12) for error messages!

Enjoy your beautiful modern extension! 🎉
