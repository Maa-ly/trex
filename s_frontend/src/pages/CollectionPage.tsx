import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Grid3X3,
  List,
  Award,
  Book,
  Film,
  Tv,
  Play,
  BookOpen,
  Library,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { NFTCard, NFTCardSkeleton } from "@/components/NFTCard";
import { StatsSkeleton } from "@/components/Skeleton";
import { CollectionsNavIcon } from "@/components/AppIcons";
import type { MediaType } from "@/types";
import { readUserNfts, getTokensMetadata } from "@/services/nft";

const typeFilters = [
  { type: null, label: "All", icon: Library },
  { type: "book", label: "Books", icon: Book },
  { type: "movie", label: "Movies", icon: Film },
  { type: "anime", label: "Anime", icon: Play },
  { type: "manga", label: "Manga", icon: BookOpen },
  { type: "tvshow", label: "TV", icon: Tv },
];

export function CollectionPage() {
  const { isConnected, completions, setCompletions, currentAccount, addToast } =
    useAppStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<MediaType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        if (!isConnected || !currentAccount?.address) {
          setIsLoading(false);
          return;
        }
        const ids = await readUserNfts(currentAccount.address as `0x${string}`);
        const items = await getTokensMetadata(ids);

        // getTokensMetadata already returns CompletionNFT[], so just use it directly
        // The function will be updated to fetch from Casper contract
        setCompletions(items);
      } catch (e: any) {
        console.error("Failed to load collection:", e);
        addToast({
          type: "error",
          message: e?.message
            ? `Failed to load collection: ${e.message}`
            : "Failed to load collection",
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, currentAccount?.address]);

  const displayNFTs = isConnected ? completions : [];

  const filteredNFTs = selectedType
    ? displayNFTs.filter((nft) => nft.media.type === selectedType)
    : displayNFTs;

  // Stats
  const totalNFTs = displayNFTs.length;
  const typeStats = displayNFTs.reduce((acc, nft) => {
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
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-coral/20 to-violet/20 flex items-center justify-center border border-coral/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.2)",
                "0 0 40px rgba(168, 85, 247, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CollectionsNavIcon isActive={true} size={58} />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-3">
            Your Collection
          </h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-8">
            Connect your wallet to view and manage your achievement NFTs. Track
            every book, movie, and anime you've completed.
          </p>

          {/* Preview Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&h=200&fit=crop",
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&h=200&fit=crop",
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&h=200&fit=crop",
            ].map((img, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-dark-800/50 border border-dark-700 overflow-hidden opacity-60 hover:opacity-80 transition-opacity"
              >
                <img
                  src={img}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <p className="text-sm text-dark-500">
            <span className="text-coral font-semibold">12,450+</span> NFTs
            minted by users
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Collection</h1>
          <p className="text-sm text-dark-400">{totalNFTs} achievement NFTs</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 bg-dark-800 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-coral text-white"
                : "text-dark-400 hover:text-white"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-coral text-white"
                : "text-dark-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <StatsSkeleton count={3} />
        ) : Object.entries(typeStats).length > 0 ? (
          Object.entries(typeStats)
            .slice(0, 3)
            .map(([type, count]) => {
              const filterData = typeFilters.find((f) => f.type === type);
              const Icon = filterData?.icon || Award;

              return (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  className="card text-center py-3 cursor-pointer"
                  onClick={() =>
                    setSelectedType(
                      selectedType === type ? null : (type as MediaType)
                    )
                  }
                >
                  <Icon className="w-5 h-5 mx-auto text-coral mb-1" />
                  <p className="text-lg font-bold text-white">{count}</p>
                  <p className="text-xs text-dark-400 capitalize">{type}s</p>
                </motion.div>
              );
            })
        ) : (
          // Show placeholder stats when no NFTs
          [
            { type: "movie", label: "Movies", icon: Film },
            { type: "book", label: "Books", icon: Book },
            { type: "anime", label: "Anime", icon: Play },
          ].map(({ type, label, icon: Icon }) => (
            <div key={type} className="card text-center py-3 opacity-50">
              <Icon className="w-5 h-5 mx-auto text-dark-500 mb-1" />
              <p className="text-lg font-bold text-dark-500">0</p>
              <p className="text-xs text-dark-500">{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {typeFilters.map(({ type, label, icon: Icon }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType(type as MediaType | null)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${
                selectedType === type
                  ? "bg-coral text-white"
                  : "bg-dark-800 text-dark-300 hover:bg-dark-700"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>

      {/* NFT Grid */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr"
              : "space-y-4"
          }
        >
          <NFTCardSkeleton count={6} />
        </div>
      ) : filteredNFTs.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr"
              : "space-y-4"
          }
        >
          {filteredNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full"
            >
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img src="/icons/cloud.svg" alt="Cloud" className="w-20 h-20" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No NFTs Found</h3>
          <p className="text-dark-400 max-w-xs">
            {selectedType
              ? `You haven't earned any ${selectedType} NFTs yet.`
              : "Start tracking media to earn your first NFT!"}
          </p>
        </div>
      )}
    </div>
  );
}
