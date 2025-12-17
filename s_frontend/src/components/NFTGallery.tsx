import React from "react";
import { useStore } from "@/store/useStore";
import { MEDIA_TYPE_LABELS } from "@/config/constants";
import { Award } from "lucide-react";
import { NFT } from "@/types";
import { WalletConnect } from "./WalletConnect";

export const NFTGallery: React.FC = () => {
  const { nfts, user } = useStore();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-glass text-center py-16 px-8">
          <Award className="w-20 h-20 mx-auto mb-6 text-primary-400" />
          <h3 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h3>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Please connect your Casper wallet to view your NFT collection
          </p>
          <div className="max-w-md mx-auto">
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="card-glass text-center py-16">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl opacity-20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl flex items-center justify-center shadow-glow">
            <Award className="w-12 h-12 text-white" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white mb-3">No NFTs yet</h3>
        <p className="text-white/70 text-lg mb-4">
          Complete media to earn your first NFT!
        </p>
        <p className="text-sm text-white/50">
          NFTs are minted automatically when you complete tracking media
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-primary-400" />
          <h3 className="text-3xl font-bold text-white">Your NFTs</h3>
        </div>
        <div className="card px-4 py-2">
          <p className="text-2xl font-bold text-white">{nfts.length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};

const NFTCard: React.FC<{ nft: NFT }> = ({ nft }) => {
  return (
    <div className="card-glass group cursor-pointer overflow-hidden">
      {/* Gradient Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary/20 to-accent-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        {/* NFT Icon */}
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
          <div className="relative w-full h-48 bg-gradient-to-br from-primary-500 via-secondary to-accent-cyan rounded-2xl flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
            <Award className="w-20 h-20 text-white animate-float" />
          </div>

          {/* Badge */}
          <div className="absolute top-3 right-3 bg-dark/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
            <p className="text-xs font-bold text-white">NFT</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-white text-lg mb-1 truncate group-hover:text-primary-300 transition-colors">
              {nft.mediaTitle}
            </h4>
            <p className="text-sm text-white/60 flex items-center gap-2">
              <span className="px-2 py-1 bg-primary-500/20 rounded-lg text-primary-300 text-xs font-semibold">
                {MEDIA_TYPE_LABELS[nft.mediaType]}
              </span>
            </p>
          </div>

          {/* Token Info */}
          <div className="bg-dark/50 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Token ID</span>
                <span className="text-white/80 font-mono">
                  {nft.tokenId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Minted</span>
                <span className="text-white/80">
                  {new Date(nft.mintedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
