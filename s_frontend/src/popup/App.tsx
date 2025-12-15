import React, { useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { MediaTracker } from '@/components/MediaTracker';
import { NFTGallery } from '@/components/NFTGallery';
import { Settings, Film, Award } from 'lucide-react';
import { useStore } from '@/store/useStore';

type Tab = 'track' | 'nfts' | 'settings';

export const PopupApp: React.FC = () => {
  const { isConnected } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('track');

  if (!isConnected) {
    return (
      <div className="w-96 min-h-[500px] bg-white">
        <div className="bg-primary text-white p-4">
          <h1 className="text-xl font-bold">Media NFT Tracker</h1>
        </div>
        <div className="p-4">
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 min-h-[500px] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold">Media NFT Tracker</h1>
        <p className="text-sm text-white/90">Track & Earn NFTs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton
          icon={<Film className="w-4 h-4" />}
          label="Track"
          active={activeTab === 'track'}
          onClick={() => setActiveTab('track')}
        />
        <TabButton
          icon={<Award className="w-4 h-4" />}
          label="NFTs"
          active={activeTab === 'nfts'}
          onClick={() => setActiveTab('nfts')}
        />
        <TabButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'track' && <MediaTracker />}
        {activeTab === 'nfts' && <NFTGallery />}
        {activeTab === 'settings' && (
          <div>
            <WalletConnect />
            <div className="mt-4">
              <a
                href="/options.html"
                target="_blank"
                className="btn-secondary w-full text-center block"
              >
                Open Privacy Settings
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-colors ${
        active
          ? 'text-primary border-b-2 border-primary font-semibold'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
};

