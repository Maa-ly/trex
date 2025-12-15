# Frontend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd s_frontend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your contract hash and API keys
   ```

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Build extension:**
   ```bash
   npm run build:extension
   ```

5. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Features Implemented

✅ Browser extension structure (Manifest V3)
✅ React + TypeScript setup
✅ Red & white color scheme
✅ Privacy settings component
✅ Wallet connection UI
✅ Media tracking UI
✅ NFT gallery
✅ Web dashboard
✅ Content script for media detection
✅ Background service worker
✅ State management with Zustand
✅ Contract integration utilities

## Next Steps

1. **Integrate CSPR.click SDK:**
   - Install and configure CSPR.click
   - Implement wallet connection
   - Add signing functionality

2. **Integrate CSPR.cloud:**
   - Set up API client
   - Fetch blockchain data
   - Query contract state

3. **Complete media detection:**
   - Enhance content script
   - Add more platform support
   - Improve title extraction

4. **Add icons:**
   - Create extension icons (16x16, 48x48, 128x128)
   - Add to `src/icons/` directory

5. **Testing:**
   - Test extension in Chrome
   - Test web dashboard
   - Test contract interactions

## Casper Tools Integration

- **CSPR.click**: Wallet connectivity (TODO: Complete integration)
- **CSPR.cloud**: Blockchain data API (TODO: Complete integration)
- **Casper JS SDK**: Contract interactions (✅ Implemented)

## Color Scheme

- Primary Red: `#DC2626`
- White: `#FFFFFF`
- Clean, modern design with red accents

