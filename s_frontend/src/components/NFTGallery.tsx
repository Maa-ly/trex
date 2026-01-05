import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Library,
  Book,
  Film,
  Play,
  Tv,
  BookOpen,
  Grid3X3,
  List,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/store/useStore";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  typeof chrome.tabs !== "undefined";

interface NFTItem {
  id: string;
  tokenId: string;
  title: string;
  type: string;
  platform: string;
  coverImage?: string;
  mintedAt: Date;
  transactionHash?: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  book: Book,
  movie: Film,
  anime: Play,
  manga: BookOpen,
  tvshow: Tv,
  video: Play,
};

const typeFilters = [
  { type: null, label: "All", icon: Library },
  { type: "book", label: "Books", icon: Book },
  { type: "movie", label: "Movies", icon: Film },
  { type: "anime", label: "Anime", icon: Play },
  { type: "manga", label: "Manga", icon: BookOpen },
  { type: "tvshow", label: "TV", icon: Tv },
];

// NFT Card Component
function NFTCard({ nft }: { nft: NFTItem }) {
  const Icon = typeIcons[nft.type] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-glass overflow-hidden group"
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-500/20 to-secondary/20">
        {nft.coverImage ? (
          <img
            src={nft.coverImage}
            alt={nft.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-white/30" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-dark/80 backdrop-blur-sm rounded-full">
          <span className="text-[10px] text-white/80 capitalize">
            {nft.type}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h3 className="text-xs font-medium text-white truncate mb-1">
          {nft.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 capitalize">
            {nft.platform}
          </span>
          <span className="text-[10px] text-white/40">#{nft.tokenId}</span>
        </div>
      </div>
    </motion.div>
  );
}

// NFT List Item Component
function NFTListItem({ nft }: { nft: NFTItem }) {
  const Icon = typeIcons[nft.type] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card-glass p-3 flex items-center gap-3"
    >
      {/* Thumbnail */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary/20 flex-shrink-0">
        {nft.coverImage ? (
          <img
            src={nft.coverImage}
            alt={nft.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-white/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-medium text-white truncate">{nft.title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
          <span className="capitalize">{nft.type}</span>
          <span>•</span>
          <span className="capitalize">{nft.platform}</span>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">Token #{nft.tokenId}</p>
      </div>

      {/* Actions */}
      {nft.transactionHash && (
        <a
          href={`https://cspr.live/deploy/${nft.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-white/40 hover:text-primary-400" />
        </a>
      )}
    </motion.div>
  );
}

export function NFTGallery() {
  const { isConnected, user } = useStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load NFTs from storage or chain
  useEffect(() => {
    if (!isConnected || !user?.address) return;

    const loadNFTs = async () => {
      setIsLoading(true);
      try {
        // Try to load from storage first
        if (isExtension) {
          const result = await chrome.storage.local.get(["userNFTs"]);
          if (result.userNFTs) {
            setNfts(result.userNFTs);
          }
        }

        // TODO: Fetch from Casper chain using user.address
        // For now, use mock data if no stored NFTs
        if (nfts.length === 0) {
          // Mock data for demonstration
          setNfts([]);
        }
      } catch (error) {
        console.error("[Trex] Failed to load NFTs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTs();
  }, [isConnected, user?.address]);

  // Filter NFTs by type
  const filteredNFTs = selectedType
    ? nfts.filter((nft) => nft.type === selectedType)
    : nfts;

  // Calculate stats
  const typeStats = nfts.reduce((acc, nft) => {
    acc[nft.type] = (acc[nft.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Re-fetch from chain
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">My Collection</h2>
          <p className="text-[10px] text-white/50">{nfts.length} NFTs</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-white/60 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-dark/50 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-primary-500 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-primary-500 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {Object.keys(typeStats).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(typeStats)
            .slice(0, 3)
            .map(([type, count]) => {
              const filterData = typeFilters.find((f) => f.type === type);
              const Icon = filterData?.icon || Award;

              return (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setSelectedType(selectedType === type ? null : type)
                  }
                  className={`card-glass text-center py-2 ${
                    selectedType === type ? "ring-1 ring-primary-500" : ""
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto text-primary-400 mb-1" />
                  <p className="text-sm font-bold text-white">{count}</p>
                  <p className="text-[10px] text-white/50 capitalize">
                    {type}s
                  </p>
                </motion.button>
              );
            })}
        </div>
      )}

      {/* Type Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {typeFilters.map(({ type, label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setSelectedType(type)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap
              transition-all duration-200
              ${
                selectedType === type
                  ? "bg-primary-500 text-white"
                  : "bg-dark/50 text-white/60 hover:bg-dark/80"
              }
            `}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* NFT Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : filteredNFTs.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredNFTs.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTCard nft={nft} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNFTs.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NFTListItem nft={nft} />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary/20 flex items-center justify-center border border-primary-500/30"
          >
            <Award className="w-8 h-8 text-primary-400" />
          </motion.div>

          <h3 className="text-base font-bold text-white mb-2">
            {selectedType ? `No ${selectedType} NFTs` : "No NFTs Yet"}
          </h3>

          <p className="text-white/60 text-xs max-w-xs mx-auto">
            {selectedType
              ? `You haven't earned any ${selectedType} achievement NFTs yet.`
              : "Complete tracking media to earn your first achievement NFT!"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
