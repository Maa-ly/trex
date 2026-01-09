import { useState, useEffect } from "react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useStore } from "@/store/useStore";
import { useAppStore } from "@/store/useAppStore";
import { LogOut, Copy, Check, ExternalLink } from "lucide-react";
import { WalletImageIcon } from "./AppIcons";
import {
  isExtension,
  openAuthPage,
  getWalletSession,
  clearWalletSession,
  setupAuthListener,
  WalletSession,
} from "@/services/extensionAuthBridge";

// Check if we're running as extension
const runningAsExtension = isExtension();

export function WalletConnect() {
  const clickRef = useClickRef();
  const { isConnected, user, setUser, setIsConnected } = useStore();
  const { fetchUserNFTs } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extension: Check for saved session on mount and setup listeners
  useEffect(() => {
    if (runningAsExtension) {
      // Check for existing session
      getWalletSession().then((session) => {
        if (session) {
          setUser({ address: session.address, network: session.network });
          setIsConnected(true);
          // Fetch user's NFTs from backend
          fetchUserNFTs(session.address).catch((err) => {
            console.error("Failed to fetch NFTs on session restore:", err);
          });
        }
      });

      // Setup external message listener (for direct extension messaging)
      setupAuthListener((session: WalletSession) => {
        console.log(
          "[WalletConnect] Session received via external message:",
          session
        );
        setUser({ address: session.address, network: session.network });
        setIsConnected(true);
        setLoading(false);
        // Fetch user's NFTs from backend
        fetchUserNFTs(session.address).catch((err) => {
          console.error("Failed to fetch NFTs on auth:", err);
        });
      });

      // Setup storage change listener (for content script bridge)
      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ) => {
        if (areaName !== "local") return;

        console.log("[WalletConnect] Storage changed:", changes);

        // Check for wallet session update
        if (changes.trex_wallet_session?.newValue) {
          const session = changes.trex_wallet_session.newValue;
          console.log("[WalletConnect] New wallet session:", session);
          setUser({ address: session.address, network: session.network });
          setIsConnected(true);
          setLoading(false);
          // Fetch user's NFTs from backend
          fetchUserNFTs(session.address).catch((err) => {
            console.error("Failed to fetch NFTs on storage change:", err);
          });
        }

        // Check for wallet disconnection
        if (
          changes.trex_wallet_connected?.oldValue === true &&
          changes.trex_wallet_connected?.newValue === undefined
        ) {
          console.log("[WalletConnect] Wallet disconnected via storage");
          setUser(null);
          setIsConnected(false);
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, [setUser, setIsConnected]);

  // Web: Use CSPR.click SDK directly
  useEffect(() => {
    if (runningAsExtension || !clickRef) return;

    const handleSignedIn = async (evt: any) => {
      const account = evt.account || evt.detail?.account || evt.detail;
      if (account) {
        const address =
          account.public_key || account.publicKey || account.activeKey;
        setUser({ address, network: "casper-test" });
        setIsConnected(true);
        setLoading(false);
        // Fetch user's NFTs from backend
        fetchUserNFTs(address).catch((err) => {
          console.error("Failed to fetch NFTs on connect:", err);
        });
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setUser(null);
    };

    clickRef.on("csprclick:signed_in", handleSignedIn);
    clickRef.on("csprclick:signed_out", handleDisconnected);
    clickRef.on("csprclick:disconnected", handleDisconnected);

    // Check existing connection
    const checkConnection = async () => {
      try {
        const activeAccount = clickRef.getActiveAccount?.();
        if (activeAccount?.public_key && !isConnected) {
          setUser({
            address: activeAccount.public_key,
            network: "casper-test",
          });
          setIsConnected(true);
          // Fetch user's NFTs from backend
          fetchUserNFTs(activeAccount.public_key).catch((err) => {
            console.error("Failed to fetch NFTs on existing connection:", err);
          });
        }
      } catch (err) {
        console.log("No active connection");
      }
    };
    checkConnection();
  }, [clickRef, setIsConnected, setUser, isConnected, fetchUserNFTs]);

  const handleConnect = async () => {
    setLoading(true);

    // Extension: Open localhost auth page
    if (runningAsExtension) {
      openAuthPage();
      // Loading will be cleared when we receive session from localhost
      // Add timeout fallback
      setTimeout(() => setLoading(false), 30000);
      return;
    }

    // Web: Use CSPR.click SDK
    if (!clickRef) {
      setTimeout(() => setLoading(false), 1000);
      return;
    }
    try {
      await clickRef.signIn();
    } catch (err) {
      console.error("Connection failed:", err);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    // Extension: Clear stored session
    if (runningAsExtension) {
      await clearWalletSession();
      setIsConnected(false);
      setUser(null);
      return;
    }

    // Web: Use CSPR.click SDK
    if (!clickRef) return;
    try {
      await clickRef.signOut();
      setIsConnected(false);
      setUser(null);
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 15) return addr;
    return `${addr.slice(0, 11)}...${addr.slice(-4)}`;
  };

  if (!isConnected || !user) {
    return (
      <div className="card-glass p-6 text-center space-y-3">
        <div className="flex flex-col items-center gap-2">
          <WalletImageIcon width={125} height={95} />
          <h2 className="text-xl font-bold text-white">Wallet</h2>
        </div>
        <p className="text-white/70 text-sm">
          Connect your Casper wallet to get started.
        </p>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-secondary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              Connecting...
            </>
          ) : runningAsExtension ? (
            <>
              Connect via Web <ExternalLink className="w-4 h-4" />
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="card-glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">
          Connected Wallet
        </h3>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>

      <div className="bg-dark/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white font-mono text-sm">
            {truncateAddress(user.address)}
          </span>
          <button
            onClick={copyAddress}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
        <div className="text-xs text-white/50">Network: {user.network}</div>
      </div>

      <button
        onClick={handleDisconnect}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Disconnect
      </button>
    </div>
  );
}
