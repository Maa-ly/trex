# Smart Contract Error Codes

This document describes the error codes returned by the Media NFT smart contract.

## Error Code Summary

The contract uses numeric error codes (1-9) to indicate different types of failures. These errors are returned as `ApiError::User(N)` where N is the error number.

### Summary by Category

#### Authentication Users (1-2)
- **User 1**: Owner access required - Only contract owner can perform this operation
- **User 2**: Backend access required - Only authorized backend wallet can perform this operation

#### Token Users (3, 9)
- **User 3**: Token ownership required - You must own this token to perform this operation
- **User 9**: Token doesn't exist - The requested token ID does not exist

#### Media & Completion Users (4-5)
- **User 4**: Duplicate completion - You have already completed this media item
- **User 5**: Invalid media ID - The provided media ID is invalid or empty

#### Group Management Users (6-8)
- **User 6**: Cannot join (no completion) - You must complete the media before joining its group
- **User 7**: Not a member (cannot leave) - You are not a member of this group
- **User 8**: Invalid member index - The group member index is out of bounds

## Detailed Error Descriptions

### Error 1: Owner Access Required
**When it occurs**: Operations that require contract owner privileges
**Example**: Transferring contract ownership, changing backend address
**Solution**: Only the contract owner can perform this operation

### Error 2: Backend Access Required
**When it occurs**: Operations that require backend wallet authorization
**Example**: Minting NFTs via `complete_and_register_by_external_id`
**Solution**: Ensure the backend wallet (configured public key) is signing the transaction

### Error 3: Token Ownership Required
**When it occurs**: Operations that require token ownership
**Example**: Transferring or burning a token you don't own
**Solution**: You can only operate on tokens you own

### Error 4: Duplicate Completion
**When it occurs**: Attempting to mint a completion NFT for media you've already completed
**Example**: Calling `complete_and_register` twice for the same media
**Solution**: Each user can only complete a media item once

### Error 5: Invalid Media ID
**When it occurs**: Providing an empty or invalid media identifier
**Example**: Passing an empty string as `media_id` or `uri`
**Solution**: Provide a valid, non-empty media identifier

### Error 6: Cannot Join Group (No Completion)
**When it occurs**: Trying to join a media group without having completed it
**Example**: Calling `join_group` before minting a completion NFT
**Solution**: Complete the media first, then join the group

### Error 7: Not a Member (Cannot Leave)
**When it occurs**: Trying to leave a group you're not a member of
**Example**: Calling `leave_group` when you haven't joined
**Solution**: Only group members can leave groups

### Error 8: Invalid Member Index
**When it occurs**: Querying a group member with an out-of-bounds index
**Example**: Calling `group_member_at` with index >= member count
**Solution**: Use `group_member_count` first to check valid range

### Error 9: Token Doesn't Exist
**When it occurs**: Referencing a token ID that hasn't been minted
**Example**: Querying metadata for a non-existent token
**Solution**: Verify the token ID exists before querying

## Frontend Error Handling

When calling the backend API or smart contract, you may receive these errors. Handle them appropriately:

```typescript
try {
  const result = await mintCompletion(userAddress, mediaUrl, mediaType, rating, review, date);
  if (!result.success) {
    if (result.error?.includes("User error: 2")) {
      // Backend authorization required
      showError("This operation requires backend authorization");
    } else if (result.error?.includes("User error: 4")) {
      // Duplicate completion
      showError("You have already completed this media");
    }
    // ... handle other errors
  }
} catch (error) {
  handleError(error);
}
```

## Backend Implementation

The backend wallet (with public key configured in `.env`) must sign all minting transactions:

- Backend signs the deploy
- User's address is passed in the `to` parameter
- NFT is minted **to** the user
- Only the authorized backend wallet can call `complete_and_register_by_external_id`

## Contract Entry Points

### Public Entry Points (Anyone can call)
- `join_group` - Join a media group (requires completion)
- `leave_group` - Leave a media group (requires membership)
- `get_similars_from_tokens` - Find similar users

### Backend-Only Entry Points (Error 2 if not backend)
- `complete_and_register_by_external_id` - Mint completion NFT

### Owner-Only Entry Points (Error 1 if not owner)
- `set_backend` - Change backend authorized address
- `transfer_ownership` - Transfer contract ownership

## Testing Error Scenarios

To test different error codes:

```bash
# Test Error 2 (backend required) - mint with non-backend wallet
# This will fail with "User error: 2"

# Test Error 4 (duplicate completion) - mint same media twice
curl -X POST http://localhost:3001/api/mint \
  -d '{"toPublicKey": "02...", "kind": 1, "uri": "media-1", "name": "Movie"}' \
  -H "Content-Type: application/json"

# Try again with same media - should fail with error 4
```

## Related Documentation
- [Backend Setup](../s_backend/README.md)
- [Frontend Integration](../s_frontend/README.md)
- [Contract Source](../s_contract/src/lib.rs)
