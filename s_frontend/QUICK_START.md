# Quick Start Guide

## Run the Frontend with pnpm

### 1. Install Dependencies (if not done)
```bash
cd s_frontend
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

This will start the Vite dev server. You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Access the Application

- **Web Dashboard**: Open `http://localhost:5173/dashboard.html` in your browser
- **Extension Popup**: Build the extension first (see below)

### 4. Build Extension (Optional)

To build the browser extension:
```bash
pnpm build:extension
```

Then load it in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Available Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production  
- `pnpm build:extension` - Build browser extension
- `pnpm preview` - Preview production build

## Troubleshooting

If you get errors:
1. Make sure you're in the `s_frontend` directory
2. Try deleting `node_modules` and reinstalling: `rm -rf node_modules && pnpm install`
3. Check that all files are in place

