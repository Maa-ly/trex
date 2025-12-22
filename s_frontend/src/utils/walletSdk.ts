// CSPR.click React SDK integration
import { useClickRef } from "@make-software/csprclick-ui";
import { useState, useEffect } from "react";

export interface WalletConnection {
  accountHash: string;
  publicKey: string;
  isConnected: boolean;
}

// Custom hook for wallet connection using CSPR.click React SDK
export const useWalletConnect = () => {
  const clickRef = useClickRef();
  const [account, setAccount] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!clickRef) return;

    // Listen for connection events
    const handleConnect = (evt: CustomEvent) => {
      const { account: connectedAccount } = evt.detail as any;
      // Normalize account fields from SDK event
      const publicKey =
        connectedAccount.public_key || connectedAccount.publicKey;
      const accountHash =
        connectedAccount.account_hash || connectedAccount.accountHash;
      if (publicKey && accountHash) {
        setAccount({ public_key: publicKey, account_hash: accountHash });
      } else if (publicKey && !accountHash) {
        // Derive account hash if not provided
        import("casper-js-sdk").then(({ CLPublicKey }) => {
          try {
            const derived =
              CLPublicKey.fromHex(publicKey).toAccountRawHashStr();
            setAccount({ public_key: publicKey, account_hash: derived });
          } catch {
            setAccount({ public_key: publicKey });
          }
        });
      } else {
        setAccount(connectedAccount);
      }
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setAccount(null);
      setIsConnected(false);
    };

    // Add event listeners
    window.addEventListener("csprclick:signed_in" as any, handleConnect);
    window.addEventListener("csprclick:signed_out" as any, handleDisconnect);

    // Check if already connected
    const checkConnection = async () => {
      try {
        const activeKey = await clickRef.getActivePublicKey?.();
        if (activeKey) {
          // Get account hash from public key
          const { CLPublicKey } = await import("casper-js-sdk");
          const accountHash =
            CLPublicKey.fromHex(activeKey).toAccountRawHashStr();
          setAccount({
            public_key: activeKey,
            account_hash: accountHash,
          });
          setIsConnected(true);
        }
      } catch (err) {
        console.log("No active connection");
      }
    };

    checkConnection();

    return () => {
      window.removeEventListener("csprclick:signed_in" as any, handleConnect);
      window.removeEventListener(
        "csprclick:signed_out" as any,
        handleDisconnect
      );
    };
  }, [clickRef]);

  const connect = async (): Promise<void> => {
    console.log("[WalletConnect] connect() called, clickRef:", clickRef);
    if (clickRef) {
      // This opens the wallet selector modal
      console.log("[WalletConnect] Calling signIn()...");
      try {
        await clickRef.signIn();
        console.log("[WalletConnect] signIn() completed");
      } catch (err) {
        console.error("[WalletConnect] signIn() error:", err);
        throw err;
      }
    } else {
      console.error("[WalletConnect] clickRef is null - SDK not initialized");
    }
  };

  const disconnect = async (): Promise<void> => {
    if (clickRef) {
      await clickRef.signOut();
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!clickRef || !account?.public_key) {
      return null;
    }

    try {
      const result = await clickRef.signMessage(message, account.public_key);
      if (result?.cancelled) {
        return null;
      }
      // Convert signature to string if it's a Uint8Array
      const signature: any = result?.signature;
      if (signature instanceof Uint8Array) {
        return Buffer.from(signature).toString("hex");
      }
      if (typeof signature === "string") {
        return signature;
      }
      return null;
    } catch (error) {
      console.error("Failed to sign message:", error);
      return null;
    }
  };

  // Format account data for compatibility with existing code
  const walletConnection: WalletConnection | null = account
    ? {
        accountHash: account.account_hash,
        publicKey: account.public_key,
        isConnected: true,
      }
    : null;

  return {
    connect,
    disconnect,
    signMessage,
    account: walletConnection,
    isConnected,
    publicKey: account?.public_key,
    accountHash: account?.account_hash,
  };
};

// Legacy functions for backward compatibility (deprecated)
export async function connectWallet(): Promise<WalletConnection | null> {
  console.warn(
    "connectWallet() is deprecated. Use useWalletConnect() hook instead."
  );
  return null;
}

export async function disconnectWallet(): Promise<void> {
  console.warn(
    "disconnectWallet() is deprecated. Use useWalletConnect() hook instead."
  );
}

export async function signMessage(
  _message: string,
  _accountHash: string
): Promise<string | null> {
  console.warn(
    "signMessage() is deprecated. Use useWalletConnect() hook instead."
  );
  return null;
}
