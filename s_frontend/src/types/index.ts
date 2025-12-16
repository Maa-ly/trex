import { MediaType } from '@/config/constants';

export interface PrivacySettings {
  trackMovies: boolean;
  trackAnime: boolean;
  trackComics: boolean;
  trackBooks: boolean;
  trackManga: boolean;
  trackShows: boolean;
  autoMint: boolean;
}

export interface MediaItem {
  id: string;
  mediaId: string;
  title: string;
  type: MediaType;
  status: 'reading' | 'watching' | 'completed';
  progress: number;
  completedAt?: Date;
  nftId?: string;
  url?: string;
  deployStatus?: string;
}

export interface NFT {
  id: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: MediaType;
  mintedAt: Date;
  tokenId: string;
}

export interface User {
  accountHash: string;
  publicKey: string;
  nfts: NFT[];
}

export interface Group {
  id: string;
  name: string;
  mediaId: string;
  mediaTitle: string;
  memberCount: number;
  createdAt: Date;
}

export interface ContractCallResult {
  success: boolean;
  deployHash?: string;
  error?: string;
  data?: any;
}
