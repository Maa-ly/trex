import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  UserCheck,
  Sparkles,
  Award,
  ChevronRight,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { useStore } from "@/store/useStore";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  typeof chrome.tabs !== "undefined";

interface MatchedUser {
  address: string;
  similarity: number;
  sharedCompletions: number;
  commonMedia?: string[];
}

interface MediaGroup {
  id: string;
  title: string;
  type: string;
  memberCount: number;
  coverImage?: string;
}

export function FindUsers() {
  const { isConnected, user } = useStore();
  const [activeTab, setActiveTab] = useState<"matches" | "groups">("matches");
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Load matches and groups
  useEffect(() => {
    if (!isConnected || !user?.address) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load from storage first
        if (isExtension) {
          const result = await chrome.storage.local.get([
            "userMatches",
            "userGroups",
            "addedFriends",
          ]);
          if (result.userMatches) setMatches(result.userMatches);
          if (result.userGroups) setGroups(result.userGroups);
          if (result.addedFriends)
            setAddedFriends(new Set(result.addedFriends));
        }

        // TODO: Fetch from Casper chain
        // For now, use empty arrays if no stored data
      } catch (error) {
        console.error("[Trex] Failed to load community data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isConnected, user?.address]);

  const toggleFriend = (address: string) => {
    setAddedFriends((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      // Save to storage
      if (isExtension) {
        chrome.storage.local.set({ addedFriends: Array.from(newSet) });
      }
      return newSet;
    });
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-0.5 bg-dark/50 rounded-lg">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === "matches"
              ? "bg-primary-500 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Matches</span>
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === "groups"
              ? "bg-primary-500 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Groups</span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "matches" ? (
          <motion.div
            key="matches"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Matches Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white/80">
                Similar Users
              </h3>
              <span className="text-[10px] text-white/50">
                {matches.length} found
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-2">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.address}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-glass p-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {match.address.slice(2, 4).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">
                            {truncateAddress(match.address)}
                          </span>
                          <button
                            onClick={() => copyAddress(match.address)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copied === match.address ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/40" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                          <span>{match.similarity}% match</span>
                          <span>•</span>
                          <span>{match.sharedCompletions} shared</span>
                        </div>
                      </div>

                      {/* Add Friend Button */}
                      <button
                        onClick={() => toggleFriend(match.address)}
                        className={`p-2 rounded-lg transition-all ${
                          addedFriends.has(match.address)
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {addedFriends.has(match.address) ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary/20 flex items-center justify-center border border-primary-500/30">
                  <Sparkles className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  No Matches Yet
                </h3>
                <p className="text-[10px] text-white/50 max-w-[200px] mx-auto">
                  Mint more NFTs to find users with similar media interests
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="groups"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {/* Groups Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white/80">
                Media Groups
              </h3>
              <span className="text-[10px] text-white/50">
                {groups.length} joined
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : groups.length > 0 ? (
              <div className="space-y-2">
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-glass p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    {/* Cover */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary/20 flex-shrink-0">
                      {group.coverImage ? (
                        <img
                          src={group.coverImage}
                          alt={group.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-white truncate">
                        {group.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                        <span className="capitalize">{group.type}</span>
                        <span>•</span>
                        <span>{group.memberCount} members</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary/20 flex items-center justify-center border border-primary-500/30">
                  <Users className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  No Groups Yet
                </h3>
                <p className="text-[10px] text-white/50 max-w-[200px] mx-auto">
                  Mint NFTs to automatically join groups for your completed
                  media
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Info */}
      <div className="card-glass p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-[10px] font-medium text-white/80 mb-0.5">
              How it works
            </h4>
            <p className="text-[10px] text-white/50 leading-relaxed">
              When you mint achievement NFTs, you automatically join groups with
              others who completed the same media. Find users with similar
              tastes!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
