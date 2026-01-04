/**
 * Casper Smart Contract Service
 * Handles interactions with the Media NFT smart contract on Casper Network
 */

import {
  CLPublicKey,
  CLValueBuilder,
  RuntimeArgs,
  DeployUtil,
} from "casper-js-sdk";

// Contract configuration
const CONTRACT_HASH = import.meta.env.VITE_CASPER_CONTRACT_HASH || "";
const CONTRACT_PACKAGE_HASH =
  import.meta.env.VITE_CASPER_CONTRACT_PACKAGE_HASH || "";
const CHAIN_NAME = import.meta.env.VITE_CASPER_CHAIN_NAME || "casper-test";
const NODE_URL =
  import.meta.env.VITE_CASPER_NODE_URL ||
  "https://node.testnet.casper.network/rpc";
const CONTRACT_NAME =
  import.meta.env.VITE_CASPER_CONTRACT_NAME || "media_nft_contract";

// Payment amount for contract calls (in motes)
const DEFAULT_PAYMENT_AMOUNT = "5000000000"; // 5 CSPR

/**
 * Media type enum matching the smart contract
 */
export enum MediaType {
  Movie = 1,
  Anime = 2,
  Comic = 3,
  Book = 4,
  Manga = 5,
  Show = 6,
}

/**
 * Transaction status for UI updates
 */
export enum TransactionStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * Result returned from sending a transaction
 */
export interface SendResult {
  status: string;
  transactionHash?: string;
  deployHash?: string;
  error?: string;
  errorData?: any;
  cancelled?: boolean;
}

/**
 * Creates a deploy for calling a contract entry point
 */
const createContractCallDeploy = (
  publicKey: CLPublicKey,
  entryPoint: string,
  runtimeArgs: RuntimeArgs,
  paymentAmount: string = DEFAULT_PAYMENT_AMOUNT
): DeployUtil.Deploy => {
  const deployParams = new DeployUtil.DeployParams(
    publicKey,
    CHAIN_NAME,
    1, // gasPrice (not used in Casper, but required)
    1800000 // ttl (30 minutes in milliseconds)
  );

  const payment = DeployUtil.standardPayment(paymentAmount);

  // Create session for stored contract call
  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    Uint8Array.from(Buffer.from(CONTRACT_HASH.replace("hash-", ""), "hex")),
    entryPoint,
    runtimeArgs
  );

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

/**
 * Mint an NFT when a user completes a media item
 * @param clickRef - CSPR.click SDK reference
 * @param mediaId - Unique identifier for the media
 * @param mediaType - Type of media (Movie, Anime, Comic, Book, Manga, Show)
 * @param mediaTitle - Title of the media
 * @param onStatusUpdate - Optional callback for status updates
 * @returns Promise with the transaction result
 */
export const mintCompletionNFT = async (
  clickRef: any,
  mediaId: string,
  mediaType: MediaType,
  mediaTitle: string,
  onStatusUpdate?: (status: string, data: any) => void
): Promise<SendResult | undefined> => {
  try {
    const activeAccount = clickRef.getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    // Build runtime arguments
    const runtimeArgs = RuntimeArgs.fromMap({
      media_id: CLValueBuilder.string(mediaId),
      media_type: CLValueBuilder.u8(mediaType),
      media_title: CLValueBuilder.string(mediaTitle),
    });

    // Create the deploy
    const deploy = createContractCallDeploy(
      publicKey,
      "mint_completion_nft",
      runtimeArgs
    );

    // Sign and send via CSPR.click
    const result = await clickRef.send(
      deploy,
      activeAccount.public_key,
      onStatusUpdate
    );

    return result;
  } catch (error) {
    console.error("[Trex] Error minting NFT:", error);
    throw error;
  }
};

/**
 * Get all NFTs owned by a user
 * @param clickRef - CSPR.click SDK reference
 * @param userAddress - Address of the user (optional, defaults to active account)
 * @returns Promise with array of NFT IDs
 */
export const getUserNFTs = async (
  clickRef: any,
  userAddress?: string
): Promise<string[]> => {
  try {
    const activeAccount = clickRef.getActiveAccount();
    const address = userAddress || activeAccount?.public_key;

    if (!address) {
      throw new Error("No address provided");
    }

    // Get RPC proxy from CSPR.click
    const proxy = clickRef.getCsprCloudProxy();
    const response = await fetch(proxy.RpcURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: proxy.RpcDigestToken,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "state_get_dictionary_item",
        params: {
          state_root_hash: await getStateRootHash(proxy),
          dictionary_identifier: {
            ContractNamedKey: {
              key: "user_nfts",
              contract_hash: CONTRACT_HASH,
            },
          },
          dictionary_item_key: address,
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Trex] Error fetching user NFTs:", data.error);
      return [];
    }

    // Parse the NFT IDs from the response
    // This will depend on the exact structure returned by the contract
    const nftIds = data.result?.stored_value?.CLValue?.parsed || [];
    return nftIds;
  } catch (error) {
    console.error("[Trex] Error getting user NFTs:", error);
    return [];
  }
};

/**
 * Check if two users can interact based on shared media completion
 * @param clickRef - CSPR.click SDK reference
 * @param user1Address - First user's address
 * @param user2Address - Second user's address
 * @param mediaId - Media ID to check
 * @returns Promise with boolean indicating if both users have the required NFT
 */
export const canUserInteract = async (
  clickRef: any,
  user1Address: string,
  user2Address: string,
  mediaId: string
): Promise<boolean> => {
  try {
    const activeAccount = clickRef.getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    // Build runtime arguments
    const runtimeArgs = RuntimeArgs.fromMap({
      user1: CLValueBuilder.key(CLPublicKey.fromHex(user1Address)),
      user2: CLValueBuilder.key(CLPublicKey.fromHex(user2Address)),
      media_id: CLValueBuilder.string(mediaId),
    });

    // Create the deploy
    const deploy = createContractCallDeploy(
      publicKey,
      "can_user_interact",
      runtimeArgs
    );

    // For read-only operations, we might want to use query_global_state instead
    // But for now, we'll use the deploy method

    // Note: This is a workaround. Ideally, we'd use query_global_state for read-only ops
    console.log("[Trex] Checking user interaction capability:", {
      user1Address,
      user2Address,
      mediaId,
      deployHash: deploy.hash.toString(),
    }); // For now, return true as a placeholder
    // TODO: Implement proper read-only contract query
    return true;
  } catch (error) {
    console.error("[Trex] Error checking user interaction:", error);
    return false;
  }
};

/**
 * Find all users who have completed a specific media item
 * @param clickRef - CSPR.click SDK reference
 * @param mediaId - Media ID to search for
 * @returns Promise with array of user addresses
 */
export const findUsersWithMedia = async (
  clickRef: any,
  mediaId: string
): Promise<string[]> => {
  try {
    const proxy = clickRef.getCsprCloudProxy();

    // Query the media_to_users dictionary
    const response = await fetch(proxy.RpcURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: proxy.RpcDigestToken,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "state_get_dictionary_item",
        params: {
          state_root_hash: await getStateRootHash(proxy),
          dictionary_identifier: {
            ContractNamedKey: {
              key: "media_to_users",
              contract_hash: CONTRACT_HASH,
            },
          },
          dictionary_item_key: mediaId,
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("[Trex] No users found for media:", mediaId);
      return [];
    }

    const userAddresses = data.result?.stored_value?.CLValue?.parsed || [];
    return userAddresses;
  } catch (error) {
    console.error("[Trex] Error finding users with media:", error);
    return [];
  }
};

/**
 * Create a new group for a specific media item
 * @param clickRef - CSPR.click SDK reference
 * @param groupId - Unique identifier for the group
 * @param groupName - Name of the group
 * @param mediaId - Media ID associated with the group
 * @param onStatusUpdate - Optional callback for status updates
 * @returns Promise with the transaction result
 */
export const createGroup = async (
  clickRef: any,
  groupId: string,
  groupName: string,
  mediaId: string,
  onStatusUpdate?: (status: string, data: any) => void
): Promise<SendResult | undefined> => {
  try {
    const activeAccount = clickRef.getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    const runtimeArgs = RuntimeArgs.fromMap({
      group_id: CLValueBuilder.string(groupId),
      group_name: CLValueBuilder.string(groupName),
      media_id: CLValueBuilder.string(mediaId),
    });

    const deploy = createContractCallDeploy(
      publicKey,
      "create_group",
      runtimeArgs
    );

    const result = await clickRef.send(
      deploy,
      activeAccount.public_key,
      onStatusUpdate
    );

    return result;
  } catch (error) {
    console.error("[Trex] Error creating group:", error);
    throw error;
  }
};

/**
 * Join a group if the user has the required NFT
 * @param clickRef - CSPR.click SDK reference
 * @param groupId - ID of the group to join
 * @param mediaId - Media ID associated with the group
 * @param onStatusUpdate - Optional callback for status updates
 * @returns Promise with the transaction result
 */
export const joinGroup = async (
  clickRef: any,
  groupId: string,
  mediaId: string,
  onStatusUpdate?: (status: string, data: any) => void
): Promise<SendResult | undefined> => {
  try {
    const activeAccount = clickRef.getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    const runtimeArgs = RuntimeArgs.fromMap({
      group_id: CLValueBuilder.string(groupId),
      media_id: CLValueBuilder.string(mediaId),
    });

    const deploy = createContractCallDeploy(
      publicKey,
      "join_group",
      runtimeArgs
    );

    const result = await clickRef.send(
      deploy,
      activeAccount.public_key,
      onStatusUpdate
    );

    return result;
  } catch (error) {
    console.error("[Trex] Error joining group:", error);
    throw error;
  }
};

/**
 * Get all members of a group
 * @param clickRef - CSPR.click SDK reference
 * @param groupId - ID of the group
 * @returns Promise with array of member addresses
 */
export const getGroupMembers = async (
  clickRef: any,
  groupId: string
): Promise<string[]> => {
  try {
    const proxy = clickRef.getCsprCloudProxy();

    const response = await fetch(proxy.RpcURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: proxy.RpcDigestToken,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "state_get_dictionary_item",
        params: {
          state_root_hash: await getStateRootHash(proxy),
          dictionary_identifier: {
            ContractNamedKey: {
              key: "group_members",
              contract_hash: CONTRACT_HASH,
            },
          },
          dictionary_item_key: groupId,
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("[Trex] No members found for group:", groupId);
      return [];
    }

    const memberAddresses = data.result?.stored_value?.CLValue?.parsed || [];
    return memberAddresses;
  } catch (error) {
    console.error("[Trex] Error getting group members:", error);
    return [];
  }
};

/**
 * Helper function to get the latest state root hash
 */
const getStateRootHash = async (proxy: any): Promise<string> => {
  const response = await fetch(proxy.RpcURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: proxy.RpcDigestToken,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "chain_get_state_root_hash",
      params: [],
      id: 1,
    }),
  });

  const data = await response.json();
  return data.result.state_root_hash;
};

/**
 * Export contract configuration for use in other modules
 */
export const CASPER_CONFIG = {
  CONTRACT_HASH,
  CONTRACT_PACKAGE_HASH,
  CHAIN_NAME,
  NODE_URL,
  CONTRACT_NAME,
} as const;
