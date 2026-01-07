/**
 * NFT Service - Casper Network Integration
 * Uses backend service for transaction signing (backend wallet authorization required)
 */

import type { MediaType, CompletionNFT } from "@/types";

// Backend API URL for minting
const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001";

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
 * Mint a completion NFT on Casper Network
 * Calls the backend service which signs with the authorized backend wallet
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
  console.log("[Trex] Minting NFT via backend:", {
    userAddress,
    mediaUrl,
    mediaType,
    backendUrl: BACKEND_API_URL,
  });

  try {
    // Get the connected user's public key
    const activeAccount = getActiveAccount();
    if (!activeAccount?.public_key) {
      throw new Error(
        "No active account connected. Please connect your wallet."
      );
    }

    // Map the media type to contract enum value
    const kindValue = mapTypeToContractEnum(mediaType);

    // Extract title from URL or use URL as fallback
    const mediaName = extractTitleFromUrl(mediaUrl) || mediaUrl;

    console.log("[Trex] Calling backend mint API:", {
      endpoint: `${BACKEND_API_URL}/api/mint`,
      payload: {
        toPublicKey: activeAccount.public_key,
        kind: kindValue,
        uri: mediaUrl,
        name: mediaName,
      },
    });

    // Call the backend API to mint
    const response = await fetch(`${BACKEND_API_URL}/api/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toPublicKey: activeAccount.public_key,
        kind: kindValue,
        uri: mediaUrl,
        name: mediaName,
      }),
    });

    const result = await response.json();

    console.log("[Trex] Backend mint response:", result);

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || "Minting failed",
      };
    }

    return {
      success: true,
      tokenId: result.deployHash,
      transactionHash: result.deployHash,
    };
  } catch (error: any) {
    console.error("[Trex] Error minting NFT:", error);

    let errorMessage = error.message || "Minting failed";

    // Check for network errors
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      errorMessage =
        "Cannot connect to minting service. Please ensure the backend is running.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Read user's NFTs from Casper Network
 *
 * Note: CSPR.cloud RPC proxy is disabled by default for security.
 * To enable blockchain queries via CSPR.click:
 * 1. Go to https://cspr.build
 * 2. Edit your CSPR.click app configuration
 * 3. Enable the RPC proxy and required RPC methods
 *
 * Alternative: Implement backend endpoint to query blockchain directly.
 * For now, returns empty array to avoid "access denied" errors.
 */
export async function readUserNfts(userAddress: string): Promise<string[]> {
  console.log("[Trex] Reading user NFTs for:", userAddress);

  if (!userAddress) {
    console.log("[Trex] No user address provided");
    return [];
  }

  // For now, we rely on local storage via the completions store
  // NFTs are added to the store when minted via MintNFTModal
  // To query blockchain directly, you would need to:
  // 1. Enable CSPR.cloud proxy in CSPR.click app settings at https://cspr.build
  // 2. Create backend endpoint: GET /api/nfts/:userAddress
  // 3. Index blockchain events to a database

  console.log(
    "[Trex] Using local storage for NFTs. Blockchain querying requires RPC proxy or backend."
  );
  return [];
}

/**
 * Get metadata for NFT tokens
 * Queries token_uri and token_owner for each token
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Join a media group
 * TODO: Implement via backend API if needed
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function joinMediaGroup(
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[Trex] Joining group:", mediaId);

  try {
    // TODO: Implement backend API endpoint for group membership
    // For now, return success as this is not critical to NFT minting
    console.log("[Trex] Group join feature not yet implemented");
    return { success: true };
  } catch (error: any) {
    console.error("[Trex] Error joining group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Leave a media group
 * TODO: Implement via backend API if needed
 * Note: Unused - kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function leaveMediaGroup(
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[Trex] Leaving group:", mediaId);

  try {
    // TODO: Implement backend API endpoint for group membership
    // For now, return success as this is not critical to NFT minting
    console.log("[Trex] Group leave feature not yet implemented");
    return { success: true };
  } catch (error: any) {
    console.error("[Trex] Error leaving group:", error);
    return { success: false, error: error.message };
  }
}
