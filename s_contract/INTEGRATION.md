# Media NFT Contract - Integration Guide

This document describes all contract entry points and how to call them for frontend integration.

## Contract Information

- **Contract Name**: `media_nft_contract`
- **Contract Version**: `1.0.0`
- **WASM File**: `target/wasm32-unknown-unknown/release/media_nft_contract.wasm`

## Entry Points

### 1. `mint_completion_nft`

Mints an NFT when a user completes reading/watching a media item.

**Parameters:**
- `media_id` (String): Unique identifier for the media (e.g., "one-piece-001", "game-of-thrones-001")
- `media_type` (u8): Type of media
  - `1` = Movie
  - `2` = Anime
  - `3` = Comic
  - `4` = Book
  - `5` = Manga
  - `6` = Show
- `media_title` (String): Title of the media (e.g., "One Piece", "Game of Thrones")

**Returns:**
- `U256`: The minted NFT ID

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    media_id: "one-piece-001",
    media_type: 2, // Anime
    media_title: "One Piece"
  })
);
```

**Use Case:**
Call this when a user completes reading a book, watching a movie/show, or finishing an anime/manga/comic.

---

### 2. `get_user_nfts`

Retrieves all NFT IDs owned by a specific user.

**Parameters:**
- `user_address` (Key): The account hash or key of the user

**Returns:**
- `List<U256>`: Array of NFT IDs owned by the user

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    user_address: userAccountHash
  })
);
```

**Use Case:**
Display all NFTs/completed media items for a user's profile.

---

### 3. `can_user_interact`

Checks if two users can interact (message/join groups) based on shared media completion.

**Parameters:**
- `user1` (Key): First user's account hash or key
- `user2` (Key): Second user's account hash or key
- `media_id` (String): Media ID to check for shared completion

**Returns:**
- `Bool`: `true` if both users have the NFT for the specified media, `false` otherwise

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    user1: user1AccountHash,
    user2: user2AccountHash,
    media_id: "game-of-thrones-001"
  })
);
```

**Use Case:**
Before allowing users to message each other or join the same group, verify they both have completed the same media.

---

### 4. `find_users_with_media`

Finds all users who have completed a specific media item (have the NFT for it).

**Parameters:**
- `media_id` (String): Media ID to search for

**Returns:**
- `List<Key>`: Array of user account hashes/keys who have completed this media

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    media_id: "calculus-book-001"
  })
);
```

**Use Case:**
Show users who have read the same book or watched the same show when a user is currently reading/watching it.

---

### 5. `create_group`

Creates a new group for a specific media item. The creator must have the NFT for that media.

**Parameters:**
- `group_id` (String): Unique identifier for the group (e.g., "calculus-study-group")
- `group_name` (String): Display name of the group (e.g., "Calculus Study Group")
- `media_id` (String): Media ID associated with the group

**Returns:**
- `Unit`: No return value (transaction succeeds or reverts)

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group",
    group_name: "Calculus Study Group",
    media_id: "calculus-book-001"
  })
);
```

**Error Codes:**
- `101`: Media not found
- `102`: Creator does not have the required NFT
- `103`: Group already exists

**Use Case:**
Allow users to create discussion groups for media they've completed.

---

### 6. `join_group`

Allows a user to join a group if they have the required NFT for the associated media.

**Parameters:**
- `group_id` (String): ID of the group to join
- `media_id` (String): Media ID associated with the group

**Returns:**
- `Unit`: No return value (transaction succeeds or reverts)

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group",
    media_id: "calculus-book-001"
  })
);
```

**Error Codes:**
- `101`: Media not found
- `102`: User does not have the required NFT
- `104`: Group does not exist
- `105`: User already in group

**Use Case:**
Allow users to join groups for media they've completed.

---

### 7. `get_group_members`

Retrieves all members of a specific group.

**Parameters:**
- `group_id` (String): ID of the group

**Returns:**
- `List<Key>`: Array of member account hashes/keys

**Example Call:**
```javascript
const deployHash = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group"
  })
);
```

**Use Case:**
Display group members list in the UI.

---

## Integration Flow Examples

### Example 1: User Completes Media and Gets NFT

```javascript
// 1. User completes "One Piece" anime
const mintDeploy = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    media_id: "one-piece-001",
    media_type: 2, // Anime
    media_title: "One Piece"
  })
);

// 2. Wait for deploy to complete
const result = await casperClient.getDeploy(mintDeploy);

// 3. Get the minted NFT ID from the result
const nftId = result.execution_results[0].result.Success.effect.transforms[0].transform.WriteCLValue.parsed;
```

### Example 2: Check if Users Can Message

```javascript
// Check if two users can interact about "Game of Thrones"
const canInteract = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    user1: user1AccountHash,
    user2: user2AccountHash,
    media_id: "game-of-thrones-001"
  })
);

// If canInteract returns true, allow messaging
```

### Example 3: Find Users with Similar Interests

```javascript
// User is reading "Calculus Made Easy", find others who have read it
const usersWithMedia = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    media_id: "calculus-book-001"
  })
);

// Display these users in the UI as potential connections
```

### Example 4: Create and Join Group

```javascript
// 1. User creates a group after completing a book
const createGroup = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group",
    group_name: "Calculus Study Group",
    media_id: "calculus-book-001"
  })
);

// 2. Another user joins the group
const joinGroup = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group",
    media_id: "calculus-book-001"
  })
);

// 3. Get all group members
const members = await casperClient.putDeploy(
  deployParams,
  runtimeArgs({
    group_id: "calculus-study-group"
  })
);
```

---

## Error Handling

All entry points may revert with the following error codes:

- `100`: NFT counter overflow
- `101`: Media not found
- `102`: User does not have required NFT
- `103`: Group already exists
- `104`: Group does not exist
- `105`: User already in group

Always check the deploy result and handle errors appropriately in your frontend.

---

## Media Type Reference

| Value | Type  |
|-------|-------|
| 1     | Movie |
| 2     | Anime |
| 3     | Comic |
| 4     | Book  |
| 5     | Manga |
| 6     | Show  |

---

## Notes for Frontend Integration

1. **Account Hash**: Use `Key::Account(AccountHash)` when passing user addresses
2. **Media IDs**: Use consistent, unique identifiers (e.g., "one-piece-001", "got-s01e01")
3. **Group IDs**: Use URL-friendly identifiers (e.g., "calculus-study-group")
4. **NFT Ownership**: Always verify NFT ownership before allowing interactions
5. **Error Handling**: Check deploy results and display appropriate error messages to users

---

## Contract Deployment

To deploy the contract:

```bash
casper-client put-deploy \
  --node-address <NODE_URL> \
  --chain-name <CHAIN_NAME> \
  --secret-key <KEY_PATH> \
  --payment-amount <AMOUNT> \
  --session-path target/wasm32-unknown-unknown/release/media_nft_contract.wasm
```

After deployment, store the contract hash for future calls.

