import React, { useState, useEffect } from "react";
import { MediaTracker } from "@/components/MediaTracker";
import { NFTGallery } from "@/components/NFTGallery";
import { FindUsers } from "@/components/FindUsers";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  Settings,
  Film,
  Award,
  Users,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { WalletImageIcon } from "@/components/AppIcons";
import {
  openAuthPage,
  getWalletSession,
  clearWalletSession,
  setupAuthListener,
  WalletSession,
} from "@/services/extensionAuthBridge";

type Tab = "track" | "nfts" | "users" | "settings";

// Header wallet component for popup
const HeaderWallet: React.FC = () => {
  const { isConnected, user, setUser, setIsConnected } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for saved session on mount and setup listeners
  useEffect(() => {
    // Check for existing session
    getWalletSession().then((session) => {
      if (session) {
        setUser({ address: session.address, network: session.network });
        setIsConnected(true);
      }
    });

    // Setup external message listener
    setupAuthListener((session: WalletSession) => {
      console.log("[PopupHeader] Session received:", session);
      setUser({ address: session.address, network: session.network });
      setIsConnected(true);
      setLoading(false);
    });

    // Setup storage change listener
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return;

      if (changes.trex_wallet_session?.newValue) {
        const session = changes.trex_wallet_session.newValue;
        setUser({ address: session.address, network: session.network });
        setIsConnected(true);
        setLoading(false);
      }

      if (
        changes.trex_wallet_connected?.oldValue === true &&
        changes.trex_wallet_connected?.newValue === undefined
      ) {
        setUser(null);
        setIsConnected(false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [setUser, setIsConnected]);

  const handleConnect = async () => {
    setLoading(true);
    openAuthPage();
    // Timeout fallback
    setTimeout(() => setLoading(false), 30000);
  };

  const handleDisconnect = async () => {
    await clearWalletSession();
    setIsConnected(false);
    setUser(null);
    setShowDropdown(false);
  };

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected || !user) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-secondary 
             rounded-lg font-medium text-white text-xs hover:opacity-90 transition-opacity 
             disabled:opacity-50 shadow-lg"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
            <span className="hidden sm:inline">Connecting...</span>
          </>
        ) : (
          <>
            <WalletImageIcon size={14} inverted={false} />
            <span>Connect</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 py-1.5 bg-dark/50 border border-white/20 
             rounded-lg text-xs hover:border-primary-400/50 transition-all duration-200"
      >
        <div className="w-5 h-5 rounded-md bg-gradient-to-r from-primary-600 to-secondary" />
        <span className="text-white/90 font-medium">
          {truncateAddress(user.address)}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-white/60 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-dark-light/95 backdrop-blur-xl rounded-xl 
                 border border-white/10 shadow-xl z-50 overflow-hidden"
          >
            {/* Account Info */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-600 to-secondary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/50">Casper Wallet</p>
                  <p className="text-xs text-white font-medium truncate">
                    {user.address}
                  </p>
                </div>
              </div>

              {/* Network Badge */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/60">{user.network}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
              {/* Copy Address */}
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-2 px-3 py-2 
                     hover:bg-white/5 rounded-lg text-xs text-white/80 
                     transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              {/* Open Dashboard */}
              <a
                href="http://localhost:5173"
                target="_blank"
                className="w-full flex items-center gap-2 px-3 py-2 
                     hover:bg-white/5 rounded-lg text-xs text-white/80 
                     transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Dashboard</span>
              </a>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-3 py-2 
                     hover:bg-red-500/10 rounded-lg text-xs text-red-400 
                     transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const PopupApp: React.FC = () => {
  const { isConnected } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("track");

  return (
    <div className="w-[420px] h-[600px] bg-gradient-to-br from-dark to-dark-light flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -left-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header with Wallet */}
      <div className="relative hero-gradient p-3 shadow-2xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-48.png" alt="Trex" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-black text-white">Trex</h1>
              <p className="text-white/70 text-[10px]">Media Achievements</p>
            </div>
          </div>
          {/* Wallet Status */}
          <HeaderWallet />
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex bg-dark-light/50 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <TabButton
          icon={<Film className="w-4 h-4" />}
          label="Track Media"
          active={activeTab === "track"}
          onClick={() => setActiveTab("track")}
        />
        <TabButton
          icon={<Award className="w-4 h-4" />}
          label="My NFTs"
          active={activeTab === "nfts"}
          onClick={() => setActiveTab("nfts")}
        />
        <TabButton
          icon={<Users className="w-4 h-4" />}
          label="Find Users"
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        />
        <TabButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>

      {/* Content - Scrollable */}
      <div
        className="relative flex-1 overflow-y-auto p-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {activeTab === "track" &&
          (isConnected ? (
            <MediaTracker
              onNavigateToSettings={() => setActiveTab("settings")}
            />
          ) : (
            <div className="card-glass text-center py-8">
              <Film className="w-12 h-12 mx-auto mb-3 text-primary-400" />
              <h3 className="text-lg font-bold text-white mb-2">
                Track Your Media
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Connect your wallet to start tracking and earning NFTs
              </p>
              <p className="text-xs text-white/50">
                Use the Connect button in the header above
              </p>
            </div>
          ))}
        {activeTab === "nfts" &&
          (isConnected ? (
            <NFTGallery />
          ) : (
            <div className="card-glass text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-3 text-primary-400" />
              <h3 className="text-lg font-bold text-white mb-2">
                Your NFT Collection
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Connect your wallet to view your achievement NFTs
              </p>
              <p className="text-xs text-white/50">
                Use the Connect button in the header above
              </p>
            </div>
          ))}
        {activeTab === "users" &&
          (isConnected ? (
            <FindUsers />
          ) : (
            <div className="card-glass text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-primary-400" />
              <h3 className="text-lg font-bold text-white mb-2">
                Find Similar Users
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Connect your wallet to find others with similar interests
              </p>
              <p className="text-xs text-white/50">
                Use the Connect button in the header above
              </p>
            </div>
          ))}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-300 relative ${
        active ? "text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary opacity-50" />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10 text-[10px] font-semibold">{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-secondary shadow-glow" />
      )}
    </button>
  );
};
