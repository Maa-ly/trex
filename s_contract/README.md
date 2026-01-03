# Media NFT Smart Contract

A Casper smart contract for minting NFTs when users complete media (books, movies, anime, comics, etc.) and enabling social features based on NFT ownership.

## Features

- **NFT Minting**: Mint NFTs when users complete reading/watching media
- **User Matching**: Find users who have completed the same media
- **Access Control**: Control messaging and group access based on NFT ownership
- **Group Management**: Create and join groups for specific media

## Contract Entry Points

### `mint_completion_nft`
Mints an NFT when a user completes a media item.

**Arguments:**
- `media_id` (String): Unique identifier for the media
- `media_type` (u8): Type of media (1=Movie, 2=Anime, 3=Comic, 4=Book, 5=Manga, 6=Show)
- `media_title` (String): Title of the media

**Returns:** NFT ID (U256)

### `get_user_nfts`
Retrieves all NFTs owned by a user.

**Arguments:**
- `user_address` (Key): Address of the user

**Returns:** List of NFT IDs (Vec<U256>)

### `can_user_interact`
Checks if two users can interact based on shared media completion.

**Arguments:**
- `user1` (Key): First user's address
- `user2` (Key): Second user's address
- `media_id` (String): Media ID to check

**Returns:** Boolean indicating if both users have the required NFT

### `find_users_with_media`
Finds all users who have completed a specific media item.

**Arguments:**
- `media_id` (String): Media ID to search for

**Returns:** List of user addresses (Vec<Key>)

### `create_group`
Creates a new group for a specific media item. Creator must have the NFT for that media.

**Arguments:**
- `group_id` (String): Unique identifier for the group
- `group_name` (String): Name of the group
- `media_id` (String): Media ID associated with the group

### `join_group`
Allows a user to join a group if they have the required NFT.

**Arguments:**
- `group_id` (String): ID of the group to join
- `media_id` (String): Media ID associated with the group

### `get_group_members`
Retrieves all members of a group.

**Arguments:**
- `group_id` (String): ID of the group

**Returns:** List of member addresses (Vec<Key>)

## Building

```bash
make build
```

This will compile the contract to `target/wasm32-unknown-unknown/release/media_nft_contract.wasm`

## Testing

```bash
make test
```

## Deployment

1. Build the contract: `make build`
2. Deploy using Casper CLI or your preferred deployment method
3. The contract will create named keys for storage:
   - `media_items`: Maps media IDs to their metadata
   - `user_nfts`: Maps user addresses to their NFT collections
   - `media_to_nft`: Maps media IDs to NFT IDs
   - `nft_counter`: Current NFT counter
   - `user_groups`: Maps users to their groups
   - `group_members`: Maps group IDs to member lists

### Deployed Contract (Testnet)

- **Deploy Date**: `2026-01-03`
- **Deployer Public Key**: `0202c2cd36b0d59236bcca641302d6514849035d71db32d3c4259cbc17a8df72ecf5`
- **Deploy Hash**: `e8937d7883f2b5425a8d4a9c3afb2aaa5b60d8d5af3d7d03de5d72c617ec6bc6`
- **Block Hash**: `ce639ef4a7c751880058d0cd797d33cf1dd1d67945ef36adedd36cddafc6edd6`
- **Contract Hash**: `hash-2735e33a51c1bcff1842bdd3e1ebf41d7c8d10c5f9387e587b2cc1bfef118a22`
- **Contract Package Hash**: `contract-package-9772721fb50de623804e1f9d195cce60d22d42729fa0845c366c421983f5e9eb`
- **Contract WASM Hash**: `contract-wasm-4f1cdd89104207eaca47e2507783edb31c2ead3e4046829d17e3f95f1b08f148`
- **Payment Amount**: `500000000000`
- **Network**: `casper-test`
- **Node URL**: `https://node.testnet.casper.network/rpc`

To use in frontend, set the following environment variables:

```
VITE_CONTRACT_HASH=hash-2735e33a51c1bcff1842bdd3e1ebf41d7c8d10c5f9387e587b2cc1bfef118a22
VITE_CONTRACT_NAME=media_nft_contract
VITE_CASPER_NETWORK=testnet
VITE_CHAIN_NAME=casper-test
VITE_NODE_URL=https://node.testnet.casper.network/rpc
```

---


VITE_CONTRACT_HASH=hash-f997743f24897ee5888894c9bcd8d2ce80545f3e0ff4f26350ba787f8c40efe0
VITE_CONTRACT_NAME=media_nft_contract
VITE_CASPER_NETWORK=testnet
VITE_CHAIN_NAME=casper-test
VITE_NODE_URL=https://node.testnet.casper.network/rpc
```

## Error Codes

- `100`: NFT counter overflow
- `101`: Media not found
- `102`: User does not have required NFT
- `103`: Group already exists
- `104`: Group does not exist
- `105`: User already in group
