// Contract configuration
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH || '';
export const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME || 'media_nft_contract';

// Network configuration
export const CASPER_NETWORK = import.meta.env.VITE_CASPER_NETWORK || 'testnet';
export const CHAIN_NAME =
  import.meta.env.VITE_CHAIN_NAME || (CASPER_NETWORK === 'testnet' ? 'casper-test' : 'casper');

export const NODE_URL =
  import.meta.env.VITE_NODE_URL ||
  (CASPER_NETWORK === 'testnet'
    ? 'https://node.testnet.casper.network/rpc'
    : 'https://node.mainnet.casper.network/rpc');

export const ENTRYPOINT_PAYMENT_AMOUNT = import.meta.env.VITE_ENTRYPOINT_PAYMENT_AMOUNT || '5000000000';
export const DEPLOY_TTL_MS = Number(import.meta.env.VITE_DEPLOY_TTL_MS || 1800000);

// CSPR.cloud configuration
export const CSPR_CLOUD_API_KEY = import.meta.env.VITE_CSPR_CLOUD_API_KEY || '';
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
