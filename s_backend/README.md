# Media NFT Backend Service

Backend service for signing NFT minting transactions with the authorized backend wallet.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and fill in your backend wallet private key:
```bash
cp .env.example .env
```

3. Edit `.env` and set `BACKEND_PRIVATE_KEY_HEX` to your Secp256K1 private key (32 bytes hex).

## Running

Development mode (with hot reload):
```bash
pnpm dev
```

Production:
```bash
pnpm build
pnpm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and backend public key.

### Mint NFT
```
POST /api/mint
Content-Type: application/json

{
  "toPublicKey": "0202c2cd...", // Recipient's public key (hex)
  "kind": 0,                    // NFT type (0=movie, 1=series, 2=anime)
  "uri": "https://...",         // Metadata URI
  "name": "Movie Title"         // NFT name
}
```

Response:
```json
{
  "success": true,
  "deployHash": "abc123...",
  "message": "NFT mint transaction submitted successfully"
}
```

### Get Deploy Status
```
GET /api/deploy/:hash
```
Returns deploy information from the Casper network.

## Security Notes

- **NEVER** commit your `.env` file or expose your private key
- The backend wallet private key should only be stored securely on the server
- Consider using a secret management service in production
