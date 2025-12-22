import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useWalletConnect } from "@/utils/walletSdk";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useCsprClick } from "@/hooks/useCsprClick";

export const WalletConnect: React.FC = () => {
  const { isConnected, user, setUser, setIsConnected } = useStore();
  const {
    connect,
    disconnect,
    account,
    isConnected: sdkConnected,
  } = useWalletConnect();
  const { isInitialized } = useCsprClick();
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync CSPR.click SDK connection state with Zustand store
  useEffect(() => {
    if (sdkConnected && account && !isConnected) {
      setUser({
        accountHash: account.accountHash,
        publicKey: account.publicKey,
        nfts: [],
      });
      setIsConnected(true);
    } else if (!sdkConnected && isConnected) {
      setUser(null);
      setIsConnected(false);
    }
  }, [sdkConnected, account, isConnected, setUser, setIsConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Wait for SDK to initialize to ensure signIn opens the modal
      if (!isInitialized) {
        await new Promise((r) => setTimeout(r, 150));
      }
      await connect();
      // Connection state will be synced via useEffect
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    // Disconnection will be synced via useEffect
  };

  const copyAddress = () => {
    if (user?.accountHash) {
      navigator.clipboard.writeText(user.accountHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && user) {
    return (
      <div className="card-glass max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center shadow-glow animate-pulse-slow">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-white">Wallet Connected</p>
              <p className="text-xs text-white/60">Casper Network</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group"
            title="Disconnect"
          >
            <LogOut className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="bg-dark/50 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono text-white/80 truncate">
              {user.accountHash.slice(0, 10)}...{user.accountHash.slice(-8)}
            </p>
            <button
              onClick={copyAddress}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/60 hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass text-center max-w-md">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl opacity-20 blur-xl" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl flex items-center justify-center shadow-glow">
          <Wallet className="w-10 h-10 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">
        Connect Your Wallet
      </h3>
      <p className="text-white/70 mb-6 leading-relaxed">
        Connect your Casper wallet to start tracking media and earning NFTs
      </p>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed relative group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </>
          )}
        </span>
      </button>
      <p className="text-xs text-white/50 mt-4">
        Need a wallet? Install{" "}
        <a
          href="https://casperwallet.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline cursor-pointer"
        >
          Casper Wallet
        </a>{" "}
        or{" "}
        <a
          href="https://chromewebstore.google.com/detail/casperdash/hmfpdofehnmfnoaneplbcpejindkoafd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline cursor-pointer"
        >
          CasperDash
        </a>
      </p>
    </div>
  );
};
