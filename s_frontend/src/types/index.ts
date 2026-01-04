// Media Types
export type MediaType =
  | "book"
  | "movie"
  | "anime"
  | "manga"
  | "comic"
  | "tvshow";

export interface MediaItem {
  id: string;
  externalId: string; // ISBN, IMDB, MAL ID, etc.
  title: string;
  type: MediaType;
  description: string;
  coverImage: string;
  releaseYear: number;
  creator: string; // Author, Director, Studio
  genre: string[];
  totalCompletions: number;
  metadata?: Record<string, string>;
}

export interface CompletionNFT {
  id: string;
  tokenId: string;
  mediaId: string;
  media: MediaItem;
  mintedAt: Date;
  transactionHash: string;
  completedAt: Date;
  rating?: number;
  review?: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

// User Types
export interface User {
  id?: string;
  address: string;
  network?: string;
  email?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  joinedAt?: Date;
  completions?: CompletionNFT[];
  favorites?: string[];
  following?: string[];
  followers?: string[];
}

// Social/Community Types
export interface Group {
  id: string;
  mediaId: string;
  media: MediaItem;
  members: User[];
  memberCount: number;
  createdAt: Date;
  recentActivity: GroupActivity[];
}

export interface GroupActivity {
  id: string;
  userId: string;
  user: User;
  type: "completion" | "review" | "join";
  content?: string;
  createdAt: Date;
}

// UI State Types
export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

// Filter Types
export interface MediaFilters {
  type?: MediaType;
  genre?: string;
  year?: number;
  search?: string;
  sortBy?: "popular" | "recent" | "alphabetical";
}

// Privacy Settings
export interface PrivacySettings {
  trackingEnabled: boolean;
  shareActivity: boolean;
  showProfile: boolean;
  allowMessages: boolean;
  trackMovies: boolean;
  trackShows: boolean;
  trackAnime: boolean;
  trackBooks: boolean;
  trackManga: boolean;
}

// NFT type alias for compatibility
export type NFT = CompletionNFT;

// Contract Call Result
export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
  deployHash?: string;
}
