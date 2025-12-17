import React, { useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { MediaTracker } from "@/components/MediaTracker";
import { NFTGallery } from "@/components/NFTGallery";
import { Settings, Film, Award, Users, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";

type Tab = "track" | "nfts" | "users" | "settings";

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

      {/* Header */}
      <div className="relative hero-gradient p-4 shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Media NFT Tracker</h1>
            <p className="text-white/80 text-xs">Track & Earn NFTs on Casper</p>
          </div>
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
        {!isConnected ? (
          <div className="flex items-center justify-center min-h-full">
            <WalletConnect />
          </div>
        ) : (
          <>
            {activeTab === "track" && <MediaTracker />}
            {activeTab === "nfts" && <NFTGallery />}
            {activeTab === "users" && (
              <div className="card-glass text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-primary-400 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Find Users
                </h3>
                <p className="text-white/70">
                  Connect with others who completed the same media
                </p>
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <WalletConnect />
                <a
                  href={chrome.runtime.getURL("src/options/index.html")}
                  target="_blank"
                  className="btn-secondary w-full text-center block"
                >
                  Open Full Settings
                </a>
                <a
                  href={chrome.runtime.getURL("src/dashboard/index.html")}
                  target="_blank"
                  className="btn-primary w-full text-center block"
                >
                  Open Dashboard
                </a>
              </div>
            )}
          </>
        )}
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
