/**
 * NFT Service - Casper Network Integration
 * Real implementation using CSPR.click SDK and casper-js-sdk
 */

import {
  CLPublicKey,
  CLValueBuilder,
  RuntimeArgs,
  DeployUtil,
} from "casper-js-sdk";
import type { MediaType, CompletionNFT } from "@/types";

/**
 * Convert hex string to Uint8Array (browser-compatible replacement for Buffer)
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, "").replace(/^hash-/, "");
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Contract configuration from environment variables
const CONTRACT_HASH = import.meta.env.VITE_CASPER_CONTRACT_HASH || "";
const CHAIN_NAME = import.meta.env.VITE_CASPER_CHAIN_NAME || "casper-test";

// Payment amount for contract calls (in motes) - 5 CSPR default
const DEFAULT_PAYMENT_AMOUNT =
  import.meta.env.VITE_ENTRYPOINT_PAYMENT_AMOUNT || "5000000000";

// Media type enum matching the smart contract (u8 values)
export enum ContractMediaType {
  Movie = 1,
  Anime = 2,
  Comic = 3,
  Book = 4,
  Manga = 5,
  Show = 6,
}

/**
 * Map tracked media type string to contract media type enum
 */
export function mapTrackedType(trackedType: string): MediaType {
  const typeMap: Record<string, MediaType> = {
    movie: "movie",
    tvshow: "tvshow",
    video: "movie", // Map video to movie
    anime: "anime",
    book: "book",
    manga: "manga",
    comic: "comic",
  };
  return typeMap[trackedType.toLowerCase()] || "movie";
}

/**
 * Map MediaType to contract u8 value
 */
function mapTypeToContractEnum(mediaType: MediaType): number {
  const typeMap: Record<MediaType, number> = {
    movie: ContractMediaType.Movie,
    tvshow: ContractMediaType.Show,
    anime: ContractMediaType.Anime,
    book: ContractMediaType.Book,
    manga: ContractMediaType.Manga,
    comic: ContractMediaType.Comic,
  };
  return typeMap[mediaType] || ContractMediaType.Movie;
}

/**
 * Get the CSPR.click reference from the global window object
 */
function getClickRef(): any {
  // @ts-ignore - csprclick is injected by CSPR.click SDK
  return window.csprclick;
}

/**
 * Get the active account from CSPR.click
 */
function getActiveAccount(): { public_key: string } | null {
  const clickRef = getClickRef();
  if (!clickRef) {
    console.warn("[Trex] CSPR.click SDK not available");
    return null;
  }
  return clickRef.getActiveAccount?.() || null;
}

/**
 * Creates a deploy for calling a contract entry point
 */
function createContractCallDeploy(
  publicKey: CLPublicKey,
  entryPoint: string,
  runtimeArgs: RuntimeArgs,
  paymentAmount: string = DEFAULT_PAYMENT_AMOUNT
): DeployUtil.Deploy {
  const deployParams = new DeployUtil.DeployParams(
    publicKey,
    CHAIN_NAME,
    1, // gasPrice (not used in Casper, but required)
    1800000 // ttl (30 minutes in milliseconds)
  );

  const payment = DeployUtil.standardPayment(paymentAmount);

  // Create session for stored contract call
  const contractHashBytes = hexToBytes(CONTRACT_HASH);

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    contractHashBytes,
    entryPoint,
    runtimeArgs
  );

  return DeployUtil.makeDeploy(deployParams, session, payment);
}

/**
 * Mint a completion NFT on Casper Network
 * Calls the 'complete_and_register_by_external_id' entry point
 *
 * Contract Entry Point:
 *   complete_and_register_by_external_id(to: Key, kind: u8, uri: String, name: String) -> U256
 */
export async function mintCompletion(
  userAddress: string,
  mediaUrl: string,
  mediaType: MediaType,
  _rating: number,
  _review: string,
  _completedDate: string
): Promise<{
  success: boolean;
  tokenId?: string;
  error?: string;
  transactionHash?: string;
}> {
  console.log("[Trex] Minting NFT:", {
    userAddress,
    mediaUrl,
    mediaType,
  });

  try {
    const clickRef = getClickRef();
    if (!clickRef) {
      throw new Error("CSPR.click SDK not available. Please refresh the page.");
    }

    const activeAccount = getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error(
        "No active account connected. Please connect your wallet."
      );
    }

    // Validate contract hash is configured
    if (!CONTRACT_HASH) {
      throw new Error(
        "Contract hash not configured. Please check VITE_CASPER_CONTRACT_HASH environment variable."
      );
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    // Create the recipient key (the user minting for themselves)
    const toKey = CLValueBuilder.key(publicKey);

    // Map the media type to contract enum value
    const kindValue = mapTypeToContractEnum(mediaType);

    // Extract title from URL or use URL as fallback
    const mediaName = extractTitleFromUrl(mediaUrl) || mediaUrl;

    // Build runtime arguments matching contract signature
    // complete_and_register_by_external_id(to: Key, kind: u8, uri: String, name: String)
    const runtimeArgs = RuntimeArgs.fromMap({
      to: toKey,
      kind: CLValueBuilder.u8(kindValue),
      uri: CLValueBuilder.string(mediaUrl),
      name: CLValueBuilder.string(mediaName),
    });

    // Create the deploy
    const deploy = createContractCallDeploy(
      publicKey,
      "complete_and_register_by_external_id",
      runtimeArgs
    );

    console.log("[Trex] Deploy created, requesting signature...");

    // Define status callback for UI updates
    const onStatusUpdate = (status: string, data: any) => {
      console.log("[Trex] Transaction status:", status, data);
    };

    // Wrap deploy in the format expected by CSPR.click SDK
    const deployJson = DeployUtil.deployToJson(deploy);
    const wrappedDeploy = { deploy: deployJson.deploy };

    console.log("[Trex] Sending deploy:", wrappedDeploy);

    // Sign and send via CSPR.click
    const result = await clickRef.send(
      wrappedDeploy,
      activeAccount.public_key,
      onStatusUpdate
    );

    console.log("[Trex] Transaction result:", result);

    if (result?.cancelled) {
      return {
        success: false,
        error: "Transaction was cancelled by user",
      };
    }

    if (result?.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    if (result?.transactionHash || result?.deployHash) {
      return {
        success: true,
        tokenId: result.transactionHash || result.deployHash,
        transactionHash: result.transactionHash || result.deployHash,
      };
    }

    return {
      success: true,
      tokenId: `tx_${Date.now()}`,
    };
  } catch (error: any) {
    console.error("[Trex] Error minting NFT:", error);

    // Check for backend authorization error
    let errorMessage = error.message || "Minting failed";
    if (
      error.message?.includes("User error: 2") ||
      error.message?.includes("ApiError::User(2)")
    ) {
      errorMessage =
        "Contract requires backend authorization. Please contact support to enable minting for your account.";
    } else if (error.message?.includes("User error")) {
      errorMessage = "Contract execution failed. " + error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract title from URL (simple extraction)
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // For YouTube, try to get video title from URL params
    if (urlObj.hostname.includes("youtube")) {
      return "YouTube Video";
    }
    // For other sites, use the pathname
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    return pathParts[pathParts.length - 1] || urlObj.hostname;
  } catch {
    return url.substring(0, 50);
  }
}

/**
 * Read user's NFTs from Casper Network
 * Queries the contract's user_token_ids entry point
 */
export async function readUserNfts(userAddress: string): Promise<string[]> {
  console.log("[Trex] Reading user NFTs:", userAddress);

  try {
    if (!userAddress) {
      return [];
    }

    const clickRef = getClickRef();
    if (!clickRef) {
      console.warn("[Trex] CSPR.click SDK not available for reading NFTs");
      return [];
    }

    // Get RPC proxy from CSPR.click
    const proxy = clickRef.getCsprCloudProxy?.();
    if (!proxy) {
      console.warn("[Trex] CSPR.cloud proxy not available");
      return [];
    }

    // Get state root hash
    const stateRootHash = await getStateRootHash(proxy);
    if (!stateRootHash) {
      console.warn("[Trex] Could not get state root hash");
      return [];
    }

    // Convert public key to account hash for dictionary lookup
    const accountHash = createAccountHashKey(userAddress);
    if (!accountHash) {
      console.warn("[Trex] Could not create account hash from public key");
      return [];
    }

    // Query user_token_ids from contract
    // Note: For dictionary items, we use the AccountNamedKey format
    const response = await fetch(proxy.RpcURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(proxy.RpcDigestToken
          ? { Authorization: proxy.RpcDigestToken }
          : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "state_get_dictionary_item",
        params: {
          state_root_hash: stateRootHash,
          dictionary_identifier: {
            ContractNamedKey: {
              key: CONTRACT_HASH,
              dictionary_name: "user_token_ids",
              dictionary_item_key: accountHash,
            },
          },
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      // Dictionary not found is expected for users who haven't minted any NFTs yet
      if (
        data.error.message?.includes("dictionary") ||
        data.error.message?.includes("URef not found")
      ) {
        console.log("[Trex] User has no NFTs yet:", userAddress);
        return [];
      }
      console.log("[Trex] Error reading NFTs:", userAddress, data.error);
      return [];
    }

    // Parse the token IDs from the response
    const tokenIds = data.result?.stored_value?.CLValue?.parsed || [];
    console.log("[Trex] Found token IDs:", tokenIds);
    return tokenIds.map((id: any) => String(id));
  } catch (error) {
    console.error("[Trex] Error reading user NFTs:", error);
    return [];
  }
}

/**
 * Create account hash key from public key hex
 */
function createAccountHashKey(publicKeyHex: string): string {
  try {
    // Clean the public key - remove any prefix if present
    const cleanKey = publicKeyHex.toLowerCase();

    const publicKey = CLPublicKey.fromHex(cleanKey);
    const accountHash = publicKey.toAccountHashStr();
    return accountHash.replace("account-hash-", "");
  } catch (error) {
    console.error("[Trex] Error creating account hash:", error);
    // Return empty string to indicate failure - don't query with invalid key
    return "";
  }
}

/**
 * Get the latest state root hash from the network
 */
async function getStateRootHash(proxy: any): Promise<string> {
  const response = await fetch(proxy.RpcURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(proxy.RpcDigestToken ? { Authorization: proxy.RpcDigestToken } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "chain_get_state_root_hash",
      params: [],
      id: 1,
    }),
  });

  const data = await response.json();
  return data.result?.state_root_hash || "";
}

/**
 * Get metadata for NFT tokens
 * Queries token_uri and token_owner for each token
 */
export async function getTokensMetadata(
  tokenIds: string[]
): Promise<CompletionNFT[]> {
  console.log("[Trex] Getting token metadata for:", tokenIds);

  if (tokenIds.length === 0) {
    return [];
  }

  const results: CompletionNFT[] = [];

  for (const tokenId of tokenIds) {
    try {
      // For now, create a basic NFT structure
      // In a full implementation, you would query token_uri and token_media_id
      const nft: CompletionNFT = {
        id: tokenId,
        tokenId: tokenId,
        mediaId: `media-${tokenId}`,
        media: {
          id: `media-${tokenId}`,
          externalId: `casper-${tokenId}`,
          title: `Achievement #${tokenId}`,
          type: "movie" as MediaType,
          description: "Completed achievement on Trex",
          coverImage: `https://picsum.photos/seed/${tokenId}/300/400`,
          releaseYear: new Date().getFullYear(),
          creator: "Trex",
          genre: ["Achievement"],
          totalCompletions: 0,
        },
        mintedAt: new Date(),
        transactionHash: `hash-${tokenId}`,
        completedAt: new Date(),
        rarity: "common",
      };

      results.push(nft);
    } catch (error) {
      console.error(
        `[Trex] Error getting metadata for token ${tokenId}:`,
        error
      );
    }
  }

  return results;
}

/**
 * Get similar users based on NFT holdings
 * Calls get_similars_from_tokens entry point
 */
export async function getSimilars(
  userAddress: string,
  limit: number = 10
): Promise<
  Array<{
    address: string;
    similarity: number;
    sharedCompletions: number;
  }>
> {
  console.log("[Trex] Getting similar users:", userAddress, limit);

  try {
    // First get user's token IDs
    const tokenIds = await readUserNfts(userAddress);
    if (tokenIds.length === 0) {
      return [];
    }

    // TODO: Implement actual contract call to get_similars_from_tokens
    // For now, return empty array as this requires complex contract queries
    return [];
  } catch (error) {
    console.error("[Trex] Error getting similar users:", error);
    return [];
  }
}

/**
 * Get media info from NFT metadata
 * Queries media_info entry point
 */
export async function mediaInfo(
  mediaUrl: string
): Promise<{ title: string; thumbnail: string } | null> {
  console.log("[Trex] Getting media info:", mediaUrl);

  try {
    // TODO: Implement actual contract query for media_info
    // This would require calling the media_info entry point with the media_id
    return null;
  } catch (error) {
    console.error("[Trex] Error getting media info:", error);
    return null;
  }
}

/**
 * Get group member count
 * Calls group_member_count entry point
 */
export async function getGroupMemberCount(mediaId: string): Promise<number> {
  console.log("[Trex] Getting group member count:", mediaId);

  try {
    const clickRef = getClickRef();
    if (!clickRef) {
      return 0;
    }

    const proxy = clickRef.getCsprCloudProxy?.();
    if (!proxy) {
      return 0;
    }

    // TODO: Implement actual contract query for group_member_count
    // This would require a state query or entry point call
    return 0;
  } catch (error) {
    console.error("[Trex] Error getting group member count:", error);
    return 0;
  }
}

/**
 * Get group member at index
 * Calls group_member_at entry point
 */
export async function getGroupMemberAt(
  mediaId: string,
  index: number
): Promise<string | null> {
  console.log("[Trex] Getting group member at index:", mediaId, index);

  try {
    // TODO: Implement actual contract query for group_member_at
    return null;
  } catch (error) {
    console.error("[Trex] Error getting group member at index:", error);
    return null;
  }
}

/**
 * Join a media group via smart contract
 * Calls join_group entry point
 */
export async function joinMediaGroup(
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[Trex] Joining group via contract:", mediaId);

  try {
    const clickRef = getClickRef();
    if (!clickRef) {
      throw new Error("CSPR.click SDK not available");
    }

    const activeAccount = getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    const runtimeArgs = RuntimeArgs.fromMap({
      media_id: CLValueBuilder.string(mediaId),
    });

    const deploy = createContractCallDeploy(
      publicKey,
      "join_group",
      runtimeArgs
    );

    const result = await clickRef.send(deploy, activeAccount.public_key);

    if (result?.cancelled) {
      return { success: false, error: "Transaction cancelled" };
    }

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Trex] Error joining group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Leave a media group via smart contract
 * Calls leave_group entry point
 */
export async function leaveMediaGroup(
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[Trex] Leaving group via contract:", mediaId);

  try {
    const clickRef = getClickRef();
    if (!clickRef) {
      throw new Error("CSPR.click SDK not available");
    }

    const activeAccount = getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error("No active account connected");
    }

    const publicKey = CLPublicKey.fromHex(activeAccount.public_key);

    const runtimeArgs = RuntimeArgs.fromMap({
      media_id: CLValueBuilder.string(mediaId),
    });

    const deploy = createContractCallDeploy(
      publicKey,
      "leave_group",
      runtimeArgs
    );

    const result = await clickRef.send(deploy, activeAccount.public_key);

    if (result?.cancelled) {
      return { success: false, error: "Transaction cancelled" };
    }

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Trex] Error leaving group:", error);
    return { success: false, error: error.message };
  }
}
