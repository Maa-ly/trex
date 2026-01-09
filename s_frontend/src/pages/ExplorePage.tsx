import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Book,
  Film,
  Tv,
  BookOpen,
  Newspaper,
  Play,
  X,
} from "lucide-react";
import type { MediaItem, MediaType } from "@/types";
import { MediaCard, MediaCardSkeleton } from "@/components/MediaCard";

const mediaTypeFilters = [
  { type: null, icon: null, label: "All" },
  { type: "book", icon: Book, label: "Books" },
  { type: "movie", icon: Film, label: "Movies" },
  { type: "anime", icon: Play, label: "Anime" },
  { type: "manga", icon: BookOpen, label: "Manga" },
  { type: "comic", icon: Newspaper, label: "Comics" },
  { type: "tvshow", icon: Tv, label: "TV" },
];

// Mock data for demonstration
// TODO: Fetch media items from backend API
const mockMediaItems: MediaItem[] = [];

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedType, setSelectedType] = useState<MediaType | null>(
    (searchParams.get("type") as MediaType) || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      // TODO: Implement real media search via backend API
      let filtered = mockMediaItems;

      if (selectedType) {
        filtered = filtered.filter((item) => item.type === selectedType);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.creator.toLowerCase().includes(query)
        );
      }

      setMediaItems(filtered);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedType, searchQuery]);

  const handleTypeChange = (type: MediaType | null) => {
    setSelectedType(type);
    if (type) {
      searchParams.set("type", type);
    } else {
      searchParams.delete("type");
    }
    setSearchParams(searchParams);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      searchParams.set("search", query);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for books, movies, anime..."
          className="input-field-search"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dark-700"
          >
            <X className="w-4 h-4 text-dark-400" />
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {mediaTypeFilters.map(({ type, icon: Icon, label }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTypeChange(type as MediaType | null)}
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
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {selectedType
              ? `${
                  selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
                }s`
              : "All Media"}
          </h2>
          <p className="text-sm text-dark-400">
            {isLoading ? "..." : `${mediaItems.length} results`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading ? (
            <MediaCardSkeleton count={6} />
          ) : mediaItems.length > 0 ? (
            mediaItems.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MediaCard
                  media={media}
                  onClick={() => navigate(`/media/${media.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <Search className="w-12 h-12 mx-auto text-dark-700 mb-4" />
              <p className="text-dark-400">No results found</p>
              <p className="text-sm text-dark-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
