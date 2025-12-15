// Contract configuration
export const CONTRACT_HASH = process.env.VITE_CONTRACT_HASH || '';
export const CONTRACT_NAME = 'media_nft_contract';

// Network configuration
export const CASPER_NETWORK = process.env.VITE_CASPER_NETWORK || 'testnet';
export const NODE_URL = 
  CASPER_NETWORK === 'testnet' 
    ? 'https://rpc.testnet.casper.network'
    : 'https://rpc.mainnet.casper.network';

// CSPR.cloud configuration
export const CSPR_CLOUD_API_KEY = process.env.VITE_CSPR_CLOUD_API_KEY || '';
export const CSPR_CLOUD_API_URL = 'https://api.cspr.cloud';

// CSPR.click configuration
export const CSPR_CLICK_APP_NAME = 'Media NFT Tracker';

// Media types
export enum MediaType {
  Movie = 1,
  Anime = 2,
  Comic = 3,
  Book = 4,
  Manga = 5,
  Show = 6,
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  [MediaType.Movie]: 'Movie',
  [MediaType.Anime]: 'Anime',
  [MediaType.Comic]: 'Comic',
  [MediaType.Book]: 'Book',
  [MediaType.Manga]: 'Manga',
  [MediaType.Show]: 'Show',
};

// Storage keys
export const STORAGE_KEYS = {
  PRIVACY_SETTINGS: 'privacy_settings',
  WALLET_CONNECTED: 'wallet_connected',
  USER_ACCOUNT: 'user_account',
  TRACKED_MEDIA: 'tracked_media',
  CONTRACT_HASH: 'contract_hash',
} as const;
