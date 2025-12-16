# Media NFT - Casper Hackathon Project

A decentralized application (dApp) that tracks user media consumption (books, movies, anime, comics, manga, shows) and mints NFTs when users complete media items. Users can connect with others who have completed the same media and join discussion groups.

## Project Structure

```
cas_hac/
├── s_contract/          # Casper smart contract
│   ├── src/            # Contract source code
│   ├── tests/          # Integration tests
│   └── INTEGRATION.md  # Integration guide for frontend
├── s_frontend/         # Frontend application (to be implemented)
└── notes.md           # Project notes and requirements
```

## Features

- **NFT Minting**: Mint NFTs when users complete reading/watching media
- **User Matching**: Find users who have completed the same media
- **Access Control**: Control messaging and group access based on NFT ownership
- **Group Management**: Create and join groups for specific media items

## Smart Contract

The smart contract is built using Casper blockchain and Rust. See `s_contract/README.md` for detailed documentation.

### Quick Start

1. **Build the contract:**
   ```bash
   cd s_contract
   make build
   ```

2. **Run tests:**
   ```bash
   make test
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh
   ```

For integration details, see `s_contract/INTEGRATION.md`.

## Frontend

Frontend implementation 



## Hackathon

Built for the Casper Network Hackathon.

