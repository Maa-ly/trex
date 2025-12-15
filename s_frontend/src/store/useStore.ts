import { create } from 'zustand';
import { persist } from './persist';
import { PrivacySettings, MediaItem, User, NFT } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';

interface AppState {
  // Privacy settings
  privacySettings: PrivacySettings;
  setPrivacySettings: (settings: Partial<PrivacySettings>) => void;
  
  // Wallet
  isConnected: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setIsConnected: (connected: boolean) => void;
  
  // Media tracking
  trackedMedia: MediaItem[];
  addMedia: (media: MediaItem) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  removeMedia: (id: string) => void;
  
  // NFTs
  nfts: NFT[];
  setNFTs: (nfts: NFT[]) => void;
  addNFT: (nft: NFT) => void;
  
  // Contract
  contractHash: string | null;
  setContractHash: (hash: string) => void;
}

const defaultPrivacySettings: PrivacySettings = {
  trackMovies: false,
  trackAnime: false,
  trackComics: false,
  trackBooks: false,
  trackManga: false,
  trackShows: false,
  autoMint: true,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Privacy settings
      privacySettings: defaultPrivacySettings,
      setPrivacySettings: (settings) =>
        set((state) => ({
          privacySettings: { ...state.privacySettings, ...settings },
        })),
      
      // Wallet
      isConnected: false,
      user: null,
      setUser: (user) => set({ user, isConnected: !!user }),
      setIsConnected: (connected) => set({ isConnected: connected }),
      
      // Media tracking
      trackedMedia: [],
      addMedia: (media) =>
        set((state) => ({
          trackedMedia: [...state.trackedMedia, media],
        })),
      updateMedia: (id, updates) =>
        set((state) => ({
          trackedMedia: state.trackedMedia.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      removeMedia: (id) =>
        set((state) => ({
          trackedMedia: state.trackedMedia.filter((item) => item.id !== id),
        })),
      
      // NFTs
      nfts: [],
      setNFTs: (nfts) => set({ nfts }),
      addNFT: (nft) =>
        set((state) => ({
          nfts: [...state.nfts, nft],
        })),
      
      // Contract
      contractHash: null,
      setContractHash: (hash) => set({ contractHash: hash }),
    }),
    {
      name: 'media-nft-storage',
      partialize: (state) => ({
        privacySettings: state.privacySettings,
        trackedMedia: state.trackedMedia,
        nfts: state.nfts,
        contractHash: state.contractHash,
        user: state.user,
        isConnected: state.isConnected,
      }),
    }
  )
);

