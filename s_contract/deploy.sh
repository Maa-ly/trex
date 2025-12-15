#!/bin/bash

# Deployment script for Media NFT Contract
# Make sure you have casper-client installed and configured

set -e

CONTRACT_NAME="media-nft-contract"
WASM_FILE="target/wasm32-unknown-unknown/release/${CONTRACT_NAME}.wasm"

echo "Building contract..."
cargo build --release --target wasm32-unknown-unknown

if [ ! -f "$WASM_FILE" ]; then
    echo "Error: WASM file not found at $WASM_FILE"
    exit 1
fi

echo "Contract built successfully!"
echo "WASM file: $WASM_FILE"
echo ""
echo "To deploy, use:"
echo "  casper-client put-deploy --node-address <NODE_URL> --chain-name <CHAIN> --secret-key <KEY_PATH> --payment-amount <AMOUNT> --session-path $WASM_FILE"

