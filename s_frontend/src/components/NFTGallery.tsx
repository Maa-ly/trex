import React from 'react';
import { useStore } from '@/store/useStore';
import { MEDIA_TYPE_LABELS } from '@/config/constants';
import { Award, ExternalLink } from 'lucide-react';

export const NFTGallery: React.FC = () => {
  const { nfts, user } = useStore();

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Please connect your wallet to view NFTs</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-semibold mb-2">No NFTs yet</p>
        <p className="text-sm">Complete media to earn your first NFT!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your NFTs ({nfts.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};

const NFTCard: React.FC<{ nft: any }> = ({ nft }) => {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{nft.mediaTitle}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {MEDIA_TYPE_LABELS[nft.mediaType]}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Token ID: {nft.tokenId.slice(0, 8)}...</span>
            <span>•</span>
            <span>{new Date(nft.mintedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

