import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletConnect } from '@/components/WalletConnect';
import { MediaTracker } from '@/components/MediaTracker';
import { NFTGallery } from '@/components/NFTGallery';
import { PrivacySettings } from '@/components/PrivacySettings';
import { useStore } from '@/store/useStore';
import { Film, Award, Settings, Users } from 'lucide-react';

export const DashboardApp: React.FC = () => {
  useStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-primary text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Media NFT Tracker</h1>
                <p className="text-white/90">Track your media and earn NFTs on Casper</p>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <NavLink to="/" icon={<Film />} label="Track Media" />
              <NavLink to="/nfts" icon={<Award />} label="My NFTs" />
              <NavLink to="/users" icon={<Users />} label="Find Users" />
              <NavLink to="/settings" icon={<Settings />} label="Settings" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<MediaTracker />} />
            <Route path="/nfts" element={<NFTGallery />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<PrivacySettings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({
  to,
  icon,
  label,
}) => {
  return (
    <a
      href={to}
      className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors"
    >
      {icon}
      {label}
    </a>
  );
};

const UsersPage: React.FC = () => {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Find Users</h2>
      <p className="text-gray-600">Find users who have completed the same media as you.</p>
      {/* TODO: Implement user search and matching */}
    </div>
  );
};
