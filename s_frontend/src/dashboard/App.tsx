import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";
import { MediaTracker } from "@/components/MediaTracker";
import { NFTGallery } from "@/components/NFTGallery";
import { PrivacySettings } from "@/components/PrivacySettings";
import { useStore } from "@/store/useStore";
import { Film, Award, Settings, Users, Sparkles } from "lucide-react";

export const DashboardApp: React.FC = () => {
  const { isConnected } = useStore();

  return (
    <Router>
      <div className="min-h-screen relative">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 hero-gradient shadow-2xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-glow">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    Media NFT Tracker
                  </h1>
                  <p className="text-white/80 text-sm font-medium">
                    Track your media and earn NFTs on Casper
                  </p>
                </div>
              </Link>
              {isConnected && <WalletConnect />}
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="sticky top-0 z-10 bg-dark-light/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-2 pt-2">
              <NavLink
                to="/"
                icon={<Film className="w-5 h-5" />}
                label="Track Media"
              />
              <NavLink
                to="/nfts"
                icon={<Award className="w-5 h-5" />}
                label="My NFTs"
              />
              <NavLink
                to="/users"
                icon={<Users className="w-5 h-5" />}
                label="Find Users"
              />
              <NavLink
                to="/settings"
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
              />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/nfts" element={<NFTGallery />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<PrivacySettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-16 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-white/50 text-sm">
              Built with 💜 for Casper Hackathon
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-300
        ${isActive ? "text-white" : "text-white/60 hover:text-white"}
      `}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary rounded-t-xl" />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-secondary shadow-glow" />
      )}
    </Link>
  );
};

const HomePage: React.FC = () => {
  const { isConnected } = useStore();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-glass text-center py-16 px-8 mb-8">
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-primary-400" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome to Media NFT Tracker
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Connect your Casper wallet to start tracking your media consumption
            and earning unique NFTs!
          </p>
          <div className="max-w-md mx-auto">
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  return <MediaTracker />;
};

const UsersPage: React.FC = () => {
  const { isConnected } = useStore();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-glass text-center py-16 px-8">
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-primary-400" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Please connect your Casper wallet to access this feature
          </p>
          <div className="max-w-md mx-auto">
            <WalletConnect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary rounded-xl flex items-center justify-center shadow-glow">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white">Find Users</h2>
      </div>
      <p className="text-white/70 text-lg mb-8">
        Connect with others who have completed the same media as you.
      </p>
      <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-primary-400 animate-pulse" />
        <p className="text-white/60">Feature coming soon...</p>
      </div>
    </div>
  );
};
