import { create } from "zustand";
import { persist } from "./persist";
import { PrivacySettings, MediaItem, User, NFT } from "@/types";

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
  trackingEnabled: false,
  shareActivity: false,
  showProfile: true,
  allowMessages: true,
  trackMovies: false,
  trackAnime: false,
  trackBooks: false,
  trackManga: false,
  trackShows: false,
};

export const useStore = create<AppState>()(
  // @ts-expect-error - Zustand persist middleware has complex typing
  persist(
    (set) => ({
      // Privacy settings
      privacySettings: defaultPrivacySettings,
      setPrivacySettings: (settings: Partial<PrivacySettings>) =>
        set((state: AppState) => ({
          privacySettings: { ...state.privacySettings, ...settings },
        })),

      // Wallet
      isConnected: false,
      user: null,
      setUser: (user: User | null) => set({ user, isConnected: !!user }),
      setIsConnected: (connected: boolean) => set({ isConnected: connected }),

      // Media tracking
      trackedMedia: [],
      addMedia: (media: MediaItem) =>
        set((state: AppState) => ({
          trackedMedia: [...state.trackedMedia, media],
        })),
      updateMedia: (id: string, updates: Partial<MediaItem>) =>
        set((state: AppState) => ({
          trackedMedia: state.trackedMedia.map((item: MediaItem) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      removeMedia: (id: string) =>
        set((state: AppState) => ({
          trackedMedia: state.trackedMedia.filter(
            (item: MediaItem) => item.id !== id
          ),
        })),

      // NFTs
      nfts: [],
      setNFTs: (nfts: NFT[]) => set({ nfts }),
      addNFT: (nft: NFT) =>
        set((state: AppState) => ({
          nfts: [...state.nfts, nft],
        })),

      // Contract
      contractHash: null,
      setContractHash: (hash: string) => set({ contractHash: hash }),
    }),
    {
      name: "media-nft-storage",
      partialize: (state: AppState) => ({
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
