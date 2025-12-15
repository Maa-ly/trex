# How to Run the Frontend

## Prerequisites

Make sure you have:
- Node.js installed (v18 or higher)
- pnpm installed (`npm install -g pnpm`)

## Step 1: Install Dependencies

```bash
cd s_frontend
pnpm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the `s_frontend` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add:
```env
VITE_CONTRACT_HASH=your_contract_hash_here
VITE_CASPER_NETWORK=testnet
VITE_CSPR_CLOUD_API_KEY=your_api_key_here
```

## Step 3: Run Development Server

For the **web dashboard**:
```bash
pnpm dev
```

This will start the Vite dev server, usually at `http://localhost:5173`

## Step 4: Build Extension

To build the browser extension:
```bash
pnpm build:extension
```

This creates a `dist` folder with the extension files.

## Step 5: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from `s_frontend/dist`

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:extension` - Build browser extension
- `pnpm preview` - Preview production build
- `pnpm lint` - Run linter

## Troubleshooting

If you get errors:
1. Make sure all dependencies are installed: `pnpm install`
2. Check that Node.js version is compatible
3. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

