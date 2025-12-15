import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { connectWallet, disconnectWallet } from '@/utils/wallet';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { isConnected, user, setUser, setIsConnected } = useStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connection = await connectWallet();
      if (connection) {
        setUser({
          accountHash: connection.accountHash,
          publicKey: connection.publicKey,
          nfts: [],
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setUser(null);
    setIsConnected(false);
  };

  const copyAddress = () => {
    if (user?.accountHash) {
      navigator.clipboard.writeText(user.accountHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && user) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Wallet Connected</p>
              <p className="text-sm text-gray-600">Casper Network</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="bg-secondary-dark rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono text-gray-700 truncate mr-2">
              {user.accountHash.slice(0, 10)}...{user.accountHash.slice(-8)}
            </p>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card text-center">
      <Wallet className="w-12 h-12 text-primary mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
      <p className="text-gray-600 mb-6">
        Connect your Casper wallet to start tracking media and earning NFTs
      </p>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

