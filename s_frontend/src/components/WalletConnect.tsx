import { useState, useEffect } from "react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useStore } from "@/store/useStore";
import { LogOut, Copy, Check } from "lucide-react";
import { WalletImageIcon } from "./AppIcons";

export function WalletConnect() {
  const clickRef = useClickRef();
  const { isConnected, user, setUser, setIsConnected } = useStore();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clickRef) return;

    const handleSignedIn = async (evt: any) => {
      const account = evt.account || evt.detail?.account || evt.detail;
      if (account) {
        const address =
          account.public_key || account.publicKey || account.activeKey;
        setUser({ address, network: "casper-test" });
        setIsConnected(true);
        setLoading(false);
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
        }
      } catch (err) {
        console.log("No active connection");
      }
    };
    checkConnection();
  }, [clickRef, setIsConnected, setUser, isConnected]);

  const handleConnect = async () => {
    if (!clickRef) {
      setLoading(true);
      // Wait a bit for SDK to initialize
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      return;
    }
    setLoading(true);
    try {
      await clickRef.signIn();
    } catch (err) {
      console.error("Connection failed:", err);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
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
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
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
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-secondary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
        >
          {loading ? "Connecting..." : "Connect Wallet"}
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
