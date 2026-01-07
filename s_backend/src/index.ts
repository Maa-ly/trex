import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import {
  DeployUtil,
  CLValueBuilder,
  CLPublicKey,
  RuntimeArgs,
  Keys,
  CasperClient,
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
    const { toPublicKey, kind, uri, name } = req.body;

    // Validate inputs
    if (!toPublicKey || kind === undefined || !uri || !name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: toPublicKey, kind, uri, name",
      });
    }

    console.log("Mint request received:", { toPublicKey, kind, uri, name });

    // Parse the recipient's public key
    let recipientKey: CLPublicKey;
    try {
      recipientKey = CLPublicKey.fromHex(toPublicKey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid toPublicKey: ${error}`,
      });
    }

    // Clean contract hash (remove "hash-" prefix if present)
    const cleanContractHash = CONTRACT_HASH!.replace(/^hash-/, "");

    // Build the deploy arguments
    const args = RuntimeArgs.fromMap({
      to: CLValueBuilder.key(recipientKey),
      kind: CLValueBuilder.u8(kind),
      uri: CLValueBuilder.string(uri),
      name: CLValueBuilder.string(name),
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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Backend public key: ${backendKeyPair.publicKey.toHex()}`);
  console.log(`Contract hash: ${CONTRACT_HASH}`);
  console.log(`Chain: ${CHAIN_NAME}`);
});
