import React from "react";
import { useStore } from "@/store/useStore";
import { PrivacySettings as PrivacySettingsType } from "@/types";
import { Shield } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

export const PrivacySettings: React.FC = () => {
  const { privacySettings, setPrivacySettings, isConnected } = useStore();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-glass text-center py-16 px-8">
          <Shield className="w-20 h-20 mx-auto mb-6 text-primary-400" />
          <h3 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Please connect your Casper wallet to manage your privacy settings
          </p>
          <div className="max-w-md mx-auto">
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  const toggleSetting = (key: keyof PrivacySettingsType) => {
    setPrivacySettings({ [key]: !privacySettings[key] });
  };

  return (
    <div className="card-glass max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary rounded-xl flex items-center justify-center shadow-glow">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white">Privacy Settings</h2>
      </div>

      <p className="text-white/70 mb-8 text-lg">
        Choose which types of media you want to track. Only enabled types will
        be monitored and can earn NFTs.
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Movies</label>
            <p className="text-sm text-white/60">Track when you watch movies</p>
          </div>
          <Toggle
            enabled={privacySettings.trackMovies}
            onChange={() => toggleSetting("trackMovies")}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Anime</label>
            <p className="text-sm text-white/60">Track when you watch anime</p>
          </div>
          <Toggle
            enabled={privacySettings.trackAnime}
            onChange={() => toggleSetting("trackAnime")}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Shows</label>
            <p className="text-sm text-white/60">
              Track when you watch TV shows
            </p>
          </div>
          <Toggle
            enabled={privacySettings.trackShows}
            onChange={() => toggleSetting("trackShows")}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Books</label>
            <p className="text-sm text-white/60">Track when you read books</p>
          </div>
          <Toggle
            enabled={privacySettings.trackBooks}
            onChange={() => toggleSetting("trackBooks")}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Manga</label>
            <p className="text-sm text-white/60">Track when you read manga</p>
          </div>
          <Toggle
            enabled={privacySettings.trackManga}
            onChange={() => toggleSetting("trackManga")}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
          <div>
            <label className="font-semibold text-white text-lg">Comics</label>
            <p className="text-sm text-white/60">Track when you read comics</p>
          </div>
          <Toggle
            enabled={privacySettings.trackComics}
            onChange={() => toggleSetting("trackComics")}
          />
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-500/20 to-secondary/20 rounded-xl border border-primary-400/30 hover:border-primary-400/50 transition-all duration-300">
            <div>
              <label className="font-semibold text-white text-lg">
                Auto-mint NFTs
              </label>
              <p className="text-sm text-white/60">
                Automatically mint NFTs when you complete media
              </p>
            </div>
            <Toggle
              enabled={privacySettings.autoMint}
              onChange={() => toggleSetting("autoMint")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({
  enabled,
  onChange,
}) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-lg ${
        enabled
          ? "bg-gradient-to-r from-primary-500 to-secondary shadow-glow"
          : "bg-white/10 border border-white/20"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
          enabled ? "translate-x-7 shadow-glow" : "translate-x-1"
        }`}
      />
    </button>
  );
};
