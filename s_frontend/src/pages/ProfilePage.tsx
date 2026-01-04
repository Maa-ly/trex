import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import {
  Settings,
  LogOut,
  Copy,
  Check,
  Award,
  Calendar,
  ExternalLink,
  Edit3,
  Book,
  Film,
  Tv,
  Play,
  BookOpen,
  ChevronRight,
  Download,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const statIcons = {
  book: Book,
  movie: Film,
  anime: Play,
  manga: BookOpen,
  tvshow: Tv,
};

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    isConnected,
    currentAccount,
    joinedAt,
    completions,
    addToast,
    logout,
  } = useAppStore();

  const [copied, setCopied] = useState(false);

  // Get display name from account
  const displayName = currentAccount?.address
    ? `${currentAccount.address.slice(0, 8)}...${currentAccount.address.slice(
        -6
      )}`
    : "Anonymous User";

  // Format join date
  const formatJoinDate = (dateString: string | null) => {
    if (!dateString) return "Recently joined";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleCopyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      addToast({ type: "info", message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate stats
  const typeStats = completions.reduce((acc, nft) => {
    acc[nft.media.type] = (acc[nft.media.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isConnected) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-coral/20 to-violet/20 flex items-center justify-center border border-coral/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.2)",
                "0 0 40px rgba(168, 85, 247, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaUser className="w-12 h-12 text-violet" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-3">
            Your Profile
          </h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-8">
            Connect your Casper wallet to view your profile, achievements, and
            manage your account settings.
          </p>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-xs mx-auto">
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">NFTs</p>
            </div>
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">Groups</p>
            </div>
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">Friends</p>
            </div>
          </div>

          {/* Wallet Download Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-sm mx-auto mt-6"
          >
            <div className="card border-coral/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-coral/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Need a Casper Wallet?
                  </h3>
                  <p className="text-xs text-dark-400 mb-3">
                    Download the Casper Wallet extension to connect and start
                    tracking your media achievements.
                  </p>
                  <a
                    href="https://www.casperwallet.io/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-coral/10 hover:bg-coral/20 
                             border border-coral/30 rounded-lg text-xs text-coral font-medium 
                             transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Casper Wallet
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coral to-violet p-[3px]">
            <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center overflow-hidden">
              <FaUser className="w-12 h-12 text-dark-400" />
            </div>
          </div>
          <button className="absolute bottom-0 right-0 p-2 rounded-full bg-coral text-white hover:bg-coral-light transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <h1 className="text-xl font-bold text-white mb-1">{displayName}</h1>

        {/* Wallet Address */}
        {currentAccount?.address && (
          <div className="flex items-center justify-center gap-2 text-sm text-dark-400 mb-4">
            <span className="font-mono">
              {currentAccount.address.slice(0, 8)}...
              {currentAccount.address.slice(-6)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 rounded hover:bg-dark-700 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-brand-green" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Network Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 text-sm">
          <div className="w-2 h-2 rounded-full bg-brand-green" />
          <span className="text-dark-300">Casper Network</span>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Your Achievements</h2>
          <div className="flex items-center gap-1 text-coral">
            <Award className="w-4 h-4" />
            <span className="font-bold">{completions.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(["book", "movie", "anime", "manga", "tvshow"] as const).map(
            (type) => {
              const Icon = statIcons[type];
              const count = typeStats[type] || 0;

              return (
                <div key={type} className="text-center">
                  <div
                    className={`
                  w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1
                  ${count > 0 ? "bg-coral/20" : "bg-dark-700"}
                `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        count > 0 ? "text-coral" : "text-dark-500"
                      }`}
                    />
                  </div>
                  <p className="text-sm font-bold text-white">{count}</p>
                  <p className="text-xs text-dark-500 capitalize">{type}s</p>
                </div>
              );
            }
          )}
        </div>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-white">Account</h2>

        {/* Wallet Address */}
        {currentAccount?.address && (
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
              <FaUser className="w-5 h-5 text-dark-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-dark-400">Wallet Address</p>
              <p className="text-white font-mono text-sm">
                {currentAccount.address.slice(0, 12)}...
                {currentAccount.address.slice(-10)}
              </p>
            </div>
          </div>
        )}

        {/* Network */}
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-dark-400">Network</p>
            <p className="text-white">Casper</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-dark-400">Member since</p>
            <p className="text-white">{formatJoinDate(joinedAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-white">Settings</h2>

        <button
          onClick={() => navigate("/settings")}
          className="card w-full flex items-center gap-4 hover:border-dark-700 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Settings className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white">Preferences</p>
            <p className="text-sm text-dark-400">
              Tracking, notifications, custom sites
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-dark-500" />
        </button>

        <button
          onClick={handleLogout}
          className="card w-full flex items-center gap-4 border-brand-red/20 hover:border-brand-red/40 hover:bg-brand-red/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-red-400">Disconnect Wallet</p>
            <p className="text-sm text-dark-400">Log out of your account</p>
          </div>
        </button>
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-dark-600 pt-4">
        Trex v1.0.0 • Casper Network
      </p>
    </div>
  );
}
