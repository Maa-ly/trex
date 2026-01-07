# Trex Media NFT Tracker - Setup Complete ✅

## Summary

Successfully implemented backend signing architecture for the Media NFT smart contract on Casper Network.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend API    │         │  Casper Network │
│  (Browser)      │         │   (Node.js)      │         │   (Testnet)     │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                            │                            │
         │  1. User connects wallet   │                            │
         │     (CSPR.click SDK)       │                            │
         │                            │                            │
         │  2. POST /api/mint         │                            │
         │     {toPublicKey, ...}     │                            │
         ├───────────────────────────>│                            │
         │                            │                            │
         │                            │  3. Sign with backend key  │
         │                            │     (Secp256K1 PEM)        │
         │                            │                            │
         │                            │  4. Submit deploy          │
         │                            ├───────────────────────────>│
         │                            │                            │
         │                            │  5. Deploy hash returned   │
         │                            │<───────────────────────────│
         │  6. Success response       │                            │
         │<───────────────────────────│                            │
         │                            │                            │
```

## What Was Fixed

### 1. Backend Service (/s_backend)
- ✅ Fixed PEM key loading with `Keys.Secp256K1.loadKeyPairFromPrivateFile()`
- ✅ Converted from ESM to CommonJS for casper-js-sdk compatibility
- ✅ Added root endpoint showing API documentation
- ✅ Backend wallet: `0202c2cD36b0D59236Bcca641302D6514849035d71db32D3c4259cbC17A8DF72Ecf5`

### 2. Frontend Service (/s_frontend/src/services/nft.ts)
- ✅ Fixed syntax errors (unclosed try-catch blocks)
- ✅ Removed duplicate contract service files
- ✅ Simplified NFT reading (CSPR.cloud proxy disabled by default)
- ✅ Improved error messages with backend connection details
- ✅ Added eslint-disable for intentionally unused helper functions

### 3. Start Script (/start.sh)
- ✅ Created executable script to run both services
- ✅ Checks dependencies and backend key
- ✅ Runs backend and frontend concurrently
- ✅ Clean shutdown with Ctrl+C

### 4. Documentation
- ✅ Created `CONTRACT_ERRORS.md` with all error codes
- ✅ Updated backend README
- ✅ Added inline documentation

## Running the Application

### Option 1: Use Start Script (Recommended)
```bash
./start.sh
```

### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd s_backend
node dist/index.js

# Terminal 2 - Frontend  
cd s_frontend
pnpm dev
```

## API Endpoints

### Backend (Port 3001)

#### GET /
```json
{
  "name": "Trex Media NFT Backend",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "GET /health",
    "mint": "POST /api/mint",
    "deployStatus": "GET /api/deploy/:hash"
  },
  "contract": {
    "hash": "hash-2735...",
    "chain": "casper-test",
    "backendPublicKey": "0202c2cd..."
  }
}
```

#### GET /health
```json
{
  "status": "ok",
  "publicKey": "0202c2cD36b0D59236Bcca641302D6514849035d71db32D3c4259cbC17A8DF72Ecf5"
}
```

#### POST /api/mint
```json
{
  "toPublicKey": "0202c2cd...",
  "kind": 1,
  "uri": "https://example.com/movie/1",
  "name": "Movie Title"
}
```

Response:
```json
{
  "success": true,
  "deployHash": "5a1ef5ab26d23f4859675478df58b7e6ef56c4dd7adc9f975484ae8f96f6d9b0",
  "message": "NFT mint transaction submitted successfully"
}
```

#### GET /api/deploy/:hash
Returns deploy information from the Casper network.

## Frontend (Port 5173)

Access at: http://localhost:5173

Features:
- Wallet connection via CSPR.click
- Media tracking
- NFT minting with rating/review
- Collection view

## Smart Contract Details

- **Network**: Casper Testnet
- **Chain**: casper-test
- **Contract Hash**: `hash-2735e33a51c1bcff1842bdd3e1ebf41d7c8d10c5f9387e587b2cc1bfef118a22`
- **Entry Point**: `complete_and_register_by_external_id(to: Key, kind: u8, uri: String, name: String) -> U256`

### Contract Error Codes

See [CONTRACT_ERRORS.md](./CONTRACT_ERRORS.md) for full documentation.

Summary:
- **Error 1**: Owner access required
- **Error 2**: Backend access required ⚠️ (Most common)
- **Error 3**: Token ownership required
- **Error 4**: Duplicate completion
- **Error 5**: Invalid media ID
- **Error 6**: Cannot join (no completion)
- **Error 7**: Not a member (cannot leave)
- **Error 8**: Invalid member index
- **Error 9**: Token doesn't exist

## Testing

### Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Root endpoint
curl http://localhost:3001/

# Mint NFT
curl -X POST http://localhost:3001/api/mint \
  -H "Content-Type: application/json" \
  -d '{
    "toPublicKey": "0202c2cd36b0d59236bcca641302d6514849035d71db32d3c4259cbc17a8df72ecf5",
    "kind": 1,
    "uri": "https://example.com/movie/1",
    "name": "Test Movie"
  }'
```

Expected response with deploy hash:
```json
{
  "success": true,
  "deployHash": "5a1ef5ab...",
  "message": "NFT mint transaction submitted successfully"
}
```

## Known Issues & Solutions

### Issue 1: "Cannot connect to minting service"
**Cause**: Backend not running  
**Solution**: Start backend with `cd s_backend && node dist/index.js`

### Issue 2: "CSPR.cloud RPC proxy is disabled"
**Cause**: RPC proxy disabled by default in CSPR.click  
**Solution**: This is expected. NFT reading requires:
1. Enable RPC proxy at https://cspr.build, OR
2. Implement backend endpoint for blockchain queries

### Issue 3: "User error: 2"
**Cause**: Contract requires backend wallet to sign  
**Solution**: Ensure backend is running and signing transactions (already configured)

### Issue 4: Port 3001 already in use
**Cause**: Previous backend process still running  
**Solution**: `lsof -ti:3001 | xargs kill -9`

## Environment Files

### Backend (.env)
```env
PORT=3001
BACKEND_KEY_PATH=./backend-key.pem
CONTRACT_HASH=hash-2735e33a51c1bcff1842bdd3e1ebf41d7c8d10c5f9387e587b2cc1bfef118a22
CHAIN_NAME=casper-test
NODE_URL=https://node.testnet.casper.network/rpc
PAYMENT_AMOUNT=5000000000
```

### Frontend (.env)
```env
VITE_BACKEND_API_URL=http://localhost:3001
VITE_CASPER_CONTRACT_HASH=hash-2735e33a51c1bcff1842bdd3e1ebf41d7c8d10c5f9387e587b2cc1bfef118a22
# ... other config
```

## Next Steps

1. **Enable RPC Proxy** (Optional)
   - Go to https://cspr.build
   - Edit CSPR.click app configuration
   - Enable RPC proxy and required methods
   - Update `readUserNfts()` to use proxy

2. **Add Backend Endpoint for NFT Reading**
   ```typescript
   // Backend: GET /api/nfts/:userAddress
   // Returns: Array of token IDs owned by user
   ```

3. **Implement Blockchain Event Indexing**
   - Index `Transfer` events from contract
   - Store in database for fast queries
   - Sync periodically

4. **Production Deployment**
   - Deploy backend to server (not localhost)
   - Update `VITE_BACKEND_API_URL` in frontend
   - Secure backend with API keys/authentication
   - Use environment-specific configs

## File Structure

```
Trex/
├── start.sh                    # Start script (both services)
├── CONTRACT_ERRORS.md          # Error code documentation
├── s_backend/                  # Backend service
│   ├── backend-key.pem         # Secp256K1 private key
│   ├── .env                    # Backend configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # Express server
├── s_frontend/                 # Frontend application
│   ├── .env                    # Frontend configuration
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── services/
│       │   └── nft.ts          # NFT service (calls backend)
│       ├── components/
│       │   └── MintNFTModal.tsx
│       └── pages/
│           └── CollectionPage.tsx
└── s_contract/                 # Smart contract (Rust)
    └── src/
        └── lib.rs
```

## Support

If you encounter issues:
1. Check logs in terminal running backend/frontend
2. Verify backend is running: `curl http://localhost:3001/health`
3. Check CONTRACT_ERRORS.md for error code meanings
4. Review backend console for detailed error messages

## Success Checklist ✅

- [x] Backend loads PEM key correctly
- [x] Backend exposes API endpoints
- [x] Backend root endpoint shows documentation
- [x] Frontend connects to backend
- [x] Minting submits deploys to testnet
- [x] Error messages are clear and helpful
- [x] Start script works
- [x] Documentation complete
- [x] All TypeScript errors resolved
