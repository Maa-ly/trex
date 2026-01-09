/**
 * Test script to query NFTs from the Casper contract
 * Tests querying user token IDs and finding users with matching media
 */

import { CasperClient, CLPublicKey, CLValueBuilder } from "casper-js-sdk";
import dotenv from "dotenv";

dotenv.config();

const NODE_URL =
  process.env.NODE_URL || "https://node.testnet.casper.network/rpc";
const CONTRACT_HASH = process.env.CONTRACT_HASH;

if (!CONTRACT_HASH) {
  console.error("ERROR: CONTRACT_HASH is required in .env");
  process.exit(1);
}

const casperClient = new CasperClient(NODE_URL);

// Test accounts
const TEST_ACCOUNTS = [
  {
    name: "Account 1",
    publicKey:
      "020229b783d9d8c925ab93704a185a8d302a16ea73225c931846b3acc020b07066d1",
    balance: "5000000000000",
  },
  {
    name: "Backend Account",
    publicKey:
      "0202c2cd36b0d59236bcca641302d6514849035d71db32d3c4259cbc17a8df72ecf5",
    balance: "4501624485597",
  },
  {
    name: "Test Account",
    publicKey:
      "0202d51a83bcffd6ba88fe431068a117994b64868acb06a83ac205658391d530aca3",
    balance: "979900000000",
  },
];

/**
 * Query user_token_ids from contract
 */
async function queryUserTokenIds(publicKeyHex: string): Promise<string[]> {
  try {
    console.log(`\nQuerying NFTs for: ${publicKeyHex}`);

    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    const userKey = CLValueBuilder.key(publicKey);

    // Clean contract hash
    const cleanContractHash = CONTRACT_HASH!.replace(/^hash-/, "");
    const contractHashBytes = Uint8Array.from(
      Buffer.from(cleanContractHash, "hex")
    );

    // Query the contract entry point
    // Note: This requires the contract to have a view/query entry point
    // The contract's user_token_ids entry point returns List<U256>

    console.log("Contract hash:", CONTRACT_HASH);
    console.log("User key:", userKey.toString());

    // Try to query dictionary directly if available
    // Dictionary name would be something like "user_token_ids_{accountHash}"
    const accountHash = publicKey
      .toAccountHashStr()
      .replace("account-hash-", "");

    console.log("Account hash:", accountHash);
    console.log(
      "\nNote: Direct contract querying requires dictionary access or calling entry points"
    );
    console.log("This is a placeholder - actual implementation needs:");
    console.log("1. Contract dictionary query for user_token_ids");
    console.log(
      "2. Or calling the user_token_ids entry point (which costs gas)"
    );
    console.log("3. Or indexing blockchain events to a database");

    return [];
  } catch (error) {
    console.error("Error querying user tokens:", error);
    return [];
  }
}

/**
 * Query media completers
 */
async function queryMediaCompleters(mediaId: string): Promise<string[]> {
  try {
    console.log(`\nQuerying users who completed media: ${mediaId}`);

    console.log("Note: This requires querying the media_completers dictionary");
    console.log("Dictionary key format: media_completers_{mediaId}");
    console.log("Returns: List<Key> (public keys of users who completed)");

    return [];
  } catch (error) {
    console.error("Error querying media completers:", error);
    return [];
  }
}

/**
 * Main test function
 */
async function main() {
  console.log("=".repeat(80));
  console.log("Testing NFT Contract Queries");
  console.log("=".repeat(80));
  console.log(`\nNode URL: ${NODE_URL}`);
  console.log(`Contract Hash: ${CONTRACT_HASH}\n`);

  // Test querying user NFTs
  console.log("\n" + "=".repeat(80));
  console.log("TEST 1: Query User NFTs");
  console.log("=".repeat(80));

  for (const account of TEST_ACCOUNTS) {
    await queryUserTokenIds(account.publicKey);
  }

  // Test querying media completers
  console.log("\n" + "=".repeat(80));
  console.log("TEST 2: Query Media Completers");
  console.log("=".repeat(80));

  const testMediaIds = [
    "test-mint-comic-1767759820509",
    "https://www.youtube.com/watch?v=oUbGya-2vJI",
  ];

  for (const mediaId of testMediaIds) {
    await queryMediaCompleters(mediaId);
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log("\nTo fully implement NFT querying, you need to:");
  console.log(
    "1. Use casperClient.queryContractDictionary() to read contract state"
  );
  console.log("2. Or create a backend service that indexes blockchain events");
  console.log("3. Or enable CSPR.cloud RPC proxy in CSPR.click app settings");
  console.log("\nContract dictionaries to query:");
  console.log(
    "- user_token_ids: Maps user Key -> List<U256> (token IDs owned)"
  );
  console.log(
    "- media_completers: Maps media_id String -> List<Key> (users who completed)"
  );
  console.log(
    "- token_media_id: Maps token_id U256 -> String (media ID for token)"
  );
  console.log("\n" + "=".repeat(80));
}

main().catch(console.error);
