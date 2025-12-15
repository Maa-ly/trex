# Media NFT Frontend

Browser extension and web app for tracking media consumption and earning NFTs on Casper Network.

## Features

- 🎬 **Media Tracking**: Automatically detect and track movies, shows, anime, books, manga, and comics
- 🎨 **Privacy Controls**: Granular privacy settings to control what media types are tracked
- 💰 **NFT Minting**: Automatically mint NFTs when you complete media
- 👥 **Social Features**: Find users with similar interests and join discussion groups
- 🔐 **Wallet Integration**: Connect with Casper wallets via CSPR.click
- 📊 **Dashboard**: View your NFTs and track your media consumption

## Tech Stack

- **React 18** with TypeScript
- **Vite** for building
- **Tailwind CSS** for styling
- **CSPR.click** for wallet integration
- **CSPR.cloud** for blockchain data
- **Casper JS SDK** for contract interactions

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file:
   ```env
   VITE_CONTRACT_HASH=your_contract_hash_here
   VITE_CASPER_NETWORK=testnet
   VITE_CSPR_CLOUD_API_KEY=your_api_key_here
   ```

3. **Build for development:**
   ```bash
   npm run dev
   ```

4. **Build extension:**
   ```bash
   npm run build:extension
   ```

5. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Project Structure

```
s_frontend/
├── src/
│   ├── components/      # React components
│   ├── config/          # Configuration and constants
│   ├── dashboard/       # Web app dashboard
│   ├── popup/           # Extension popup
│   ├── options/         # Extension options page
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts
│   ├── store/           # State management (Zustand)
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── package.json
└── vite.config.ts
```

## Development

- **Web App**: `npm run dev` - Opens at `http://localhost:5173/dashboard.html`
- **Extension**: Build and load in Chrome
- **Options Page**: Access via extension settings or `chrome://extensions`

## Integration with Smart Contract

See `../s_contract/INTEGRATION.md` for contract integration details.

## Color Scheme

- **Primary**: Red (#DC2626)
- **Secondary**: White (#FFFFFF)
- Clean, modern design with red accents

## License

Part of the Casper Hackathon project.

