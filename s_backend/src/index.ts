import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import {
  DeployUtil,
  CLValueBuilder,
  CLPublicKey,
  RuntimeArgs,
  Keys,
  CasperClient,
  Contracts,
} from "casper-js-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 3001;
const BACKEND_KEY_PATH = process.env.BACKEND_KEY_PATH || "./backend-key.pem";
const CONTRACT_HASH = process.env.CONTRACT_HASH;
const CHAIN_NAME = process.env.CHAIN_NAME || "casper-test";
const NODE_URL =
  process.env.NODE_URL || "https://node.testnet.casper.network/rpc";
const PAYMENT_AMOUNT = process.env.PAYMENT_AMOUNT || "10000000000";

if (!CONTRACT_HASH) {
  console.error("ERROR: CONTRACT_HASH is required");
  process.exit(1);
}

// Load the backend key from PEM file
let backendKeyPair: Keys.AsymmetricKey;
try {
  const keyPath = path.resolve(BACKEND_KEY_PATH);
  console.log("Loading backend key from:", keyPath);

  // Use Secp256K1.loadKeyPairFromPrivateFile for EC keys (prefix 02)
  backendKeyPair = Keys.Secp256K1.loadKeyPairFromPrivateFile(keyPath);

  console.log("Loaded Secp256K1 backend key");
  console.log("Backend public key:", backendKeyPair.publicKey.toHex());
} catch (error) {
  console.error("Failed to load backend private key:", error);
  console.error(
    "Make sure the PEM file exists at:",
    path.resolve(BACKEND_KEY_PATH)
  );
  process.exit(1);
}

const casperClient = new CasperClient(NODE_URL);

// Helper function to compute media ID (same as contract logic)
function computeMediaId(kind: number, uri: string, name: string): string {
  // Create a buffer with: kind + uri + 0x00 + name
  const buffer = Buffer.concat([
    Buffer.from([kind]),
    Buffer.from(uri, "utf8"),
    Buffer.from([0]),
    Buffer.from(name, "utf8"),
  ]);

  // Compute blake2b hash
  const hash = crypto.createHash("blake2b512").update(buffer).digest();

  // Return first 32 bytes as hex string
  return hash.slice(0, 32).toString("hex");
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Trex Media NFT Backend",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "GET /health",
      mint: "POST /api/mint",
      deployStatus: "GET /api/deploy/:hash",
    },
    contract: {
      hash: CONTRACT_HASH,
      chain: CHAIN_NAME,
      backendPublicKey: backendKeyPair.publicKey.toHex(),
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", publicKey: backendKeyPair.publicKey.toHex() });
});

// Mint NFT endpoint
app.post("/api/mint", async (req, res) => {
  try {
    const { userPublicKey, mediaUrl, mediaTitle, mediaType } = req.body;

    // Validate inputs
    if (!userPublicKey || mediaType === undefined || !mediaUrl || !mediaTitle) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: userPublicKey, mediaUrl, mediaTitle, mediaType",
      });
    }

    console.log("Mint request received:", {
      userPublicKey,
      mediaType,
      mediaUrl,
      mediaTitle,
    });

    // Parse the recipient's public key
    let recipientKey: CLPublicKey;
    try {
      recipientKey = CLPublicKey.fromHex(userPublicKey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid userPublicKey: ${error}`,
      });
    }

    // Clean contract hash (remove "hash-" prefix if present)
    const cleanContractHash = CONTRACT_HASH!.replace(/^hash-/, "");

    // Build the deploy arguments
    const args = RuntimeArgs.fromMap({
      to: CLValueBuilder.key(recipientKey),
      kind: CLValueBuilder.u8(mediaType),
      uri: CLValueBuilder.string(mediaUrl),
      name: CLValueBuilder.string(mediaTitle),
    });

    // Create the deploy
    const deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(
        backendKeyPair.publicKey,
        CHAIN_NAME,
        1,
        1800000 // 30 minutes TTL
      ),
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Uint8Array.from(Buffer.from(cleanContractHash, "hex")),
        "complete_and_register_by_external_id",
        args
      ),
      DeployUtil.standardPayment(PAYMENT_AMOUNT)
    );

    // Sign the deploy with backend key
    const signedDeploy = DeployUtil.signDeploy(deploy, backendKeyPair);

    console.log("Deploy hash:", signedDeploy.hash.toString());

    // Send deploy to the network
    const deployHash = await casperClient.putDeploy(signedDeploy);

    console.log("Deploy submitted:", deployHash);

    res.json({
      success: true,
      deployHash,
      message: "NFT mint transaction submitted successfully",
    });
  } catch (error: any) {
    console.error("Mint error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to mint NFT",
    });
  }
});

// Get deploy status endpoint
app.get("/api/deploy/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const deployInfo = await casperClient.getDeploy(hash);

    res.json({
      success: true,
      deploy: deployInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get deploy status",
    });
  }
});

// Query user's NFT token IDs from contract
app.get("/api/user-nfts/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: publicKey",
      });
    }

    console.log("Query user NFTs for:", publicKey);

    try {
      // Parse user's public key
      const userPublicKey = CLPublicKey.fromHex(publicKey);
      const accountHash = userPublicKey
        .toAccountHashStr()
        .replace("account-hash-", "");

      console.log("[API] Querying contract storage for user:", accountHash);

      // Create a Contract instance
      const contract = new Contracts.Contract(casperClient);
      contract.setContractHash(CONTRACT_HASH!);

      // Query the user_token_ids data from contract
      console.log("[API] Querying contract data: user_token_ids");
      const userTokenIdsData = await contract.queryContractData([
        "user_token_ids",
      ]);

      console.log(
        "[API] user_token_ids data:",
        JSON.stringify(userTokenIdsData, null, 2)
      );

      // Parse the BTreeMap to find our user's token IDs
      // The data is returned as an array of [key, value] pairs
      let tokenIds: string[] = [];

      if (Array.isArray(userTokenIdsData)) {
        console.log(
          "[API] Parsing BTreeMap with",
          userTokenIdsData.length,
          "entries"
        );

        // BTreeMap is returned as an array of [Key, tokenIds[]] pairs
        for (const entry of userTokenIdsData) {
          if (Array.isArray(entry) && entry.length === 2) {
            const [keyData, valueData] = entry;

            // The key is the account hash as a hex string
            let keyAccountHash = "";

            // Try to extract the hash from various possible formats
            if (typeof keyData === "string") {
              keyAccountHash = keyData.toLowerCase().replace(/^0x/, "");
            } else if (Buffer.isBuffer(keyData)) {
              keyAccountHash = keyData.toString("hex").toLowerCase();
            } else if (keyData && typeof keyData === "object") {
              // CLValue format - try to extract the underlying bytes
              const keyStr = JSON.stringify(keyData);
              // Look for hex pattern
              const hexMatch = keyStr.match(/[0-9a-fA-F]{64}/);
              if (hexMatch) {
                keyAccountHash = hexMatch[0].toLowerCase();
              }
            }

            console.log("[API] Checking entry with key:", keyAccountHash);

            // Check if this matches our user's account hash
            if (keyAccountHash === accountHash.toLowerCase()) {
              console.log("[API] Found matching entry for user!");

              // Extract token IDs from the value
              if (Array.isArray(valueData)) {
                // Direct array of token IDs
                tokenIds = valueData.map((id: any) => {
                  if (typeof id === "string") return id;
                  if (typeof id === "number") return id.toString();
                  return JSON.stringify(id);
                });
              } else if (valueData && typeof valueData === "object") {
                // CLValue format - parse it
                const valueStr = JSON.stringify(valueData);
                try {
                  // Try to find array pattern in the JSON
                  const arrayMatch = valueStr.match(/\[([\d,"]+)\]/);
                  if (arrayMatch) {
                    const parsed = JSON.parse(`[${arrayMatch[1]}]`);
                    tokenIds = parsed.map((id: any) => String(id));
                  }
                } catch (e) {
                  console.error("[API] Failed to parse value array:", e);
                }
              }

              console.log("[API] Extracted token IDs:", tokenIds);
              break;
            }
          }
        }
      }

      console.log("[API] Final user token IDs:", tokenIds);

      res.json({
        success: true,
        tokenIds,
        count: tokenIds.length,
      });
    } catch (queryError: any) {
      console.error("[API] Contract query error:", queryError);
      // Return empty if contract doesn't have data yet or user has no tokens
      res.json({
        success: true,
        tokenIds: [],
        count: 0,
      });
    }
  } catch (error: any) {
    console.error("Query user NFTs error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to query user NFTs",
    });
  }
});

// Find users who completed a specific media item
app.post("/api/find-users", async (req, res) => {
  try {
    const { mediaType, mediaUrl, mediaTitle } = req.body;

    if (mediaType === undefined || !mediaUrl || !mediaTitle) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: mediaType, mediaUrl, mediaTitle",
      });
    }

    // Compute the media ID hash
    const mediaIdHash = computeMediaId(mediaType, mediaUrl, mediaTitle);

    console.log("Find users request for media:", {
      mediaType,
      mediaUrl,
      mediaTitle,
      mediaIdHash,
    });

    try {
      console.log(
        "[API] Querying contract storage for mediaIdHash:",
        mediaIdHash
      );

      // Create a Contract instance
      const contract = new Contracts.Contract(casperClient);
      contract.setContractHash(CONTRACT_HASH!);

      // Query the media_completers data from contract
      console.log("[API] Querying contract data: media_completers");
      const mediaCompletersData = await contract.queryContractData([
        "media_completers",
      ]);

      console.log(
        "[API] media_completers data:",
        JSON.stringify(mediaCompletersData, null, 2)
      );

      // Parse the BTreeMap to find users for this mediaIdHash
      // The data is returned as an array of [mediaIdHash, users[]] pairs
      let users: string[] = [];

      if (Array.isArray(mediaCompletersData)) {
        // BTreeMap is returned as an array of [mediaIdHash, userKeys[]] pairs
        for (const entry of mediaCompletersData) {
          if (Array.isArray(entry) && entry.length === 2) {
            const [key, value] = entry;
            // Check if this is our mediaIdHash entry
            if (key === mediaIdHash || String(key) === mediaIdHash) {
              // Value is a CLValue containing an array of Keys
              const valueJson = JSON.stringify(value);
              try {
                const parsedValue = JSON.parse(valueJson);
                if (Array.isArray(parsedValue)) {
                  users = parsedValue.map((userKey: any) => String(userKey));
                }
              } catch (e) {
                console.error("[API] Failed to parse users value:", e);
              }
              break;
            }
          }
        }
      }

      console.log("[API] Users who completed media:", users);

      res.json({
        success: true,
        users,
        count: users.length,
      });
    } catch (queryError: any) {
      console.error("[API] Contract query error:", queryError);
      // Return empty if contract doesn't have data yet or no members
      res.json({
        success: true,
        users: [],
        count: 0,
      });
    }
  } catch (error: any) {
    console.error("Find users error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to find users",
    });
  }
});
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Backend public key: ${backendKeyPair.publicKey.toHex()}`);
  console.log(`Contract hash: ${CONTRACT_HASH}`);
  console.log(`Chain: ${CHAIN_NAME}`);
});
