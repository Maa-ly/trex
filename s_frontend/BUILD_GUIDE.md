# Build Guide

## Two Separate Build Outputs

This project has **two different build outputs** for two different purposes:

### 1. **Web App Build** → `dist/`
- **Command**: `pnpm run build`
- **Output Folder**: `dist/`
- **Purpose**: Deploy to web hosting (Vercel, Netlify, etc.)
- **Access**: Via browser at `https://your-domain.com`
- **Note**: ⚠️ **DO NOT** try to load `dist/` as a Chrome extension - it has no manifest.json

### 2. **Chrome Extension Build** → `dist-extension/`
- **Command**: `pnpm run build:extension`
- **Output Folder**: `dist-extension/`
- **Purpose**: Load as Chrome/Edge extension
- **Access**: Chrome → Extensions → Load Unpacked → Select `dist-extension/` folder
- **Note**: ✅ This folder contains `manifest.json` required for extensions

## Quick Start

### For Web Development:
```bash
pnpm run dev          # Start dev server at localhost:5173
pnpm run build        # Build for production → dist/
```

### For Extension Development:
```bash
pnpm run build:extension    # Build extension → dist-extension/
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist-extension/` folder

## Common Mistakes

❌ **WRONG**: Trying to load `dist/` as extension
- Error: "Manifest file is missing or unreadable"
- Solution: Use `dist-extension/` instead

✅ **CORRECT**: 
- Web hosting → Use `dist/`
- Chrome extension → Use `dist-extension/`
