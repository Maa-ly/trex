import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Globe,
  Shield,
  Bell,
  ExternalLink,
  ChevronDown,
  Plus,
  X,
  Info,
  Trash2,
  Download,
} from "lucide-react";

// Supported platforms list with URLs
const SUPPORTED_PLATFORMS: Record<
  string,
  { domains: string[]; url: string; type: string }
> = {
  // Streaming Services
  Netflix: {
    domains: ["netflix.com"],
    url: "https://netflix.com",
    type: "TV/Movie",
  },
  "Prime Video": {
    domains: ["primevideo.com"],
    url: "https://primevideo.com",
    type: "TV/Movie",
  },
  "Disney+": {
    domains: ["disneyplus.com"],
    url: "https://disneyplus.com",
    type: "TV/Movie",
  },
  Hulu: { domains: ["hulu.com"], url: "https://hulu.com", type: "TV/Movie" },
  Crunchyroll: {
    domains: ["crunchyroll.com"],
    url: "https://crunchyroll.com",
    type: "Anime",
  },
  YouTube: {
    domains: ["youtube.com"],
    url: "https://youtube.com",
    type: "Video",
  },
  Webtoons: {
    domains: ["webtoons.com"],
    url: "https://www.webtoons.com/en/",
    type: "Manga",
  },
  MangaDex: {
    domains: ["mangadex.org"],
    url: "https://mangadex.org",
    type: "Manga",
  },
  Tapas: { domains: ["tapas.io"], url: "https://tapas.io", type: "Manga" },
  Comick: { domains: ["comick.io"], url: "https://comick.io", type: "Manga" },
  Goodreads: {
    domains: ["goodreads.com"],
    url: "https://goodreads.com",
    type: "Books",
  },
  Kindle: {
    domains: ["read.amazon.com"],
    url: "https://read.amazon.com",
    type: "Books",
  },
  HiAnime: {
    domains: ["hianime.to"],
    url: "https://hianime.to",
    type: "Anime",
  },
  AniWave: {
    domains: ["aniwave.to"],
    url: "https://aniwave.to",
    type: "Anime",
  },
  "9anime": {
    domains: ["9animetv.to"],
    url: "https://9animetv.to",
    type: "Anime",
  },
  GogoAnime: {
    domains: ["gogoanime.hu"],
    url: "https://gogoanime.hu",
    type: "Anime",
  },
  MyAnimeList: {
    domains: ["myanimelist.net"],
    url: "https://myanimelist.net",
    type: "Anime",
  },
  AniList: {
    domains: ["anilist.co"],
    url: "https://anilist.co",
    type: "Anime",
  },
  Twitch: { domains: ["twitch.tv"], url: "https://twitch.tv", type: "Video" },
  Bilibili: {
    domains: ["bilibili.com"],
    url: "https://bilibili.com",
    type: "Video",
  },
  Mangakakalot: {
    domains: ["mangakakalot.com"],
    url: "https://mangakakalot.com",
    type: "Manga",
  },
  Manganato: {
    domains: ["manganato.com"],
    url: "https://manganato.com",
    type: "Manga",
  },
  Fmovies: {
    domains: ["fmovies.to"],
    url: "https://fmovies.to",
    type: "TV/Movie",
  },
  SolarMovie: {
    domains: ["solarmovie.pe"],
    url: "https://solarmovie.pe",
    type: "TV/Movie",
  },
};

// Media type options
const MEDIA_TYPES = [
  { value: "movie", label: "Movies" },
  { value: "tvshow", label: "TV Shows" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
  { value: "book", label: "Books" },
] as const;

interface TrackingPreferences {
  autoTrack: boolean;
  notifications: boolean;
  autoMint: boolean;
  trackOnAllSites: boolean;
  showTrackingIndicator?: boolean;
  anonymousTracking?: boolean;
  storeThumbnails?: boolean;
}

interface CustomSite {
  domain: string;
  name: string;
  type: "movie" | "tvshow" | "anime" | "manga" | "book";
  url?: string;
  enabled?: boolean;
}

// Custom Dropdown Component
function CustomDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-dark-light rounded-xl text-sm text-white border border-white/10 
                   focus:border-primary-400 outline-none flex items-center justify-between"
      >
        <span>{selectedOption?.label || "Select type"}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-dark-light border border-white/10 
                       rounded-xl overflow-hidden z-50 shadow-xl"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors
                  ${
                    value === option.value
                      ? "bg-primary-500/20 text-primary-400"
                      : "text-white/80"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OptionsApp() {
  const [activeSection, setActiveSection] = useState("general");
  const [preferences, setPreferences] = useState<TrackingPreferences>({
    autoTrack: true,
    notifications: true,
    autoMint: false,
    trackOnAllSites: false,
  });
  const [customSites, setCustomSites] = useState<CustomSite[]>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState<CustomSite>({
    domain: "",
    name: "",
    type: "movie",
  });
  const [stats, setStats] = useState({
    completions: 0,
    nftsMinted: 0,
    watchTime: 0,
  });

  // Load data on mount
  useEffect(() => {
    chrome.storage.local.get(
      ["trackingPreferences", "customSites", "completions", "nftsMinted"],
      (result) => {
        if (result.trackingPreferences) {
          setPreferences(result.trackingPreferences);
        }
        if (result.customSites) {
          setCustomSites(result.customSites);
        }
        setStats({
          completions: result.completions?.length || 0,
          nftsMinted: result.nftsMinted || 0,
          watchTime: 0,
        });
      }
    );
  }, []);

  const updatePreference = (key: keyof TrackingPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    chrome.storage.local.set({ trackingPreferences: newPrefs });
  };

  const addCustomSite = () => {
    if (!newSite.domain || !newSite.name) return;
    const updated = [...customSites, newSite];
    setCustomSites(updated);
    chrome.storage.local.set({ customSites: updated });
    setNewSite({ domain: "", name: "", type: "movie" });
    setShowAddSite(false);
  };

  const removeCustomSite = (domain: string) => {
    const updated = customSites.filter((s) => s.domain !== domain);
    setCustomSites(updated);
    chrome.storage.local.set({ customSites: updated });
  };

  const exportData = async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trex-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    if (
      confirm("Are you sure you want to clear all data? This cannot be undone.")
    ) {
      await chrome.storage.local.clear();
      setPreferences({
        autoTrack: true,
        notifications: true,
        autoMint: false,
        trackOnAllSites: false,
      });
      setCustomSites([]);
      setStats({ completions: 0, nftsMinted: 0, watchTime: 0 });
    }
  };

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "platforms", label: "Platforms", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark-light">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/icons/icon-48.png" alt="Trex" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-black text-white">Trex Settings</h1>
              <p className="text-white/60 text-sm">
                Configure your media tracking experience
              </p>
            </div>
          </div>
          <a
            href="http://localhost:5173"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary 
                     rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
            Open Dashboard
          </a>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === section.id
                    ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="col-span-3 space-y-6">
            {activeSection === "general" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="card-glass p-4 text-center">
                    <p className="text-3xl font-bold text-primary-400">
                      {stats.completions}
                    </p>
                    <p className="text-sm text-white/60">Completions</p>
                  </div>
                  <div className="card-glass p-4 text-center">
                    <p className="text-3xl font-bold text-secondary">
                      {stats.nftsMinted}
                    </p>
                    <p className="text-sm text-white/60">NFTs Minted</p>
                  </div>
                  <div className="card-glass p-4 text-center">
                    <p className="text-3xl font-bold text-green-400">
                      {stats.watchTime}h
                    </p>
                    <p className="text-sm text-white/60">Watch Time</p>
                  </div>
                </div>

                {/* Tracking Preferences */}
                <div className="card-glass p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-400" />
                    Tracking Preferences
                  </h2>
                  <div className="space-y-4">
                    <PreferenceToggle
                      label="Auto-track media"
                      description="Automatically start tracking on supported sites"
                      enabled={preferences.autoTrack}
                      onChange={(v) => updatePreference("autoTrack", v)}
                    />
                    <PreferenceToggle
                      label="Auto-mint NFTs"
                      description="Automatically mint when you complete media (requires gas)"
                      enabled={preferences.autoMint}
                      onChange={(v) => updatePreference("autoMint", v)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "platforms" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Supported Platforms */}
                <div className="card-glass p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-400" />
                    Supported Platforms (
                    {Object.keys(SUPPORTED_PLATFORMS).length})
                  </h2>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {Object.entries(SUPPORTED_PLATFORMS).map(
                      ([name, { url, type }]) => (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          className="flex items-center justify-between p-3 rounded-xl 
                                 bg-dark/50 border border-white/5 hover:border-primary-500/30 
                                 hover:bg-primary-500/10 transition-all group"
                        >
                          <div>
                            <span className="text-sm text-white font-medium group-hover:text-primary-400 transition-colors">
                              {name}
                            </span>
                            <span className="text-xs text-white/40 block">
                              {type}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-primary-400 transition-colors" />
                        </a>
                      )
                    )}
                  </div>
                </div>

                {/* Custom Sites */}
                <div className="card-glass p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary-400" />
                      Custom Sites
                    </h2>
                    <button
                      onClick={() => setShowAddSite(true)}
                      className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      + Add Site
                    </button>
                  </div>

                  {customSites.length > 0 ? (
                    <div className="space-y-2">
                      {customSites.map((site) => (
                        <div
                          key={site.domain}
                          className="flex items-center justify-between p-3 bg-dark/50 rounded-xl
                                   hover:bg-primary-500/10 hover:border-primary-500/30 border border-transparent
                                   transition-all group cursor-pointer"
                          onClick={() => {
                            const url = site.url || `https://${site.domain}`;
                            chrome.tabs.create({ url });
                          }}
                        >
                          <div>
                            <span className="text-sm text-white font-medium group-hover:text-primary-400 transition-colors">
                              {site.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/40">
                                {site.domain}
                              </span>
                              <span className="text-xs text-primary-400 capitalize">
                                • {site.type}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomSite(site.domain);
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40 text-center py-4">
                      No custom sites added yet
                    </p>
                  )}

                  {/* Add Site Modal */}
                  <AnimatePresence>
                    {showAddSite && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 p-4 bg-dark rounded-xl border border-white/10"
                      >
                        <h3 className="text-sm font-medium text-white mb-4">
                          Add Custom Site
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">
                              Site Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., MyAnime"
                              value={newSite.name}
                              onChange={(e) =>
                                setNewSite({ ...newSite, name: e.target.value })
                              }
                              className="w-full px-4 py-3 bg-dark-light rounded-xl text-sm text-white 
                                       border border-white/10 focus:border-primary-400 outline-none
                                       placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">
                              Domain
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., myanime.com"
                              value={newSite.domain}
                              onChange={(e) =>
                                setNewSite({
                                  ...newSite,
                                  domain: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-dark-light rounded-xl text-sm text-white 
                                       border border-white/10 focus:border-primary-400 outline-none
                                       placeholder:text-white/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50 mb-1 block">
                              Media Type
                            </label>
                            <CustomDropdown
                              value={newSite.type}
                              onChange={(value) =>
                                setNewSite({
                                  ...newSite,
                                  type: value as CustomSite["type"],
                                })
                              }
                              options={[...MEDIA_TYPES]}
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => setShowAddSite(false)}
                              className="flex-1 py-3 text-sm text-white/60 hover:text-white 
                                       bg-dark-light rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addCustomSite}
                              disabled={!newSite.domain || !newSite.name}
                              className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary 
                                       text-white text-sm font-medium rounded-xl disabled:opacity-50 
                                       disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                              Add Site
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card-glass p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary-400" />
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    <PreferenceToggle
                      label="Completion notifications"
                      description="Get notified when you complete watching/reading media"
                      enabled={preferences.notifications}
                      onChange={(v) => updatePreference("notifications", v)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "privacy" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card-glass p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-400" />
                    Privacy & Data
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-dark/50 rounded-xl">
                      <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">
                          Your Data is Local
                        </h3>
                        <p className="text-xs text-white/50">
                          All tracking data is stored locally on your device. We
                          never send your viewing history to our servers. Only
                          when you choose to mint an NFT, the completion data is
                          recorded on the blockchain.
                        </p>
                      </div>
                    </div>

                    {/* Privacy Toggles */}
                    <div className="border-t border-white/10 pt-4 space-y-1">
                      <h3 className="text-sm font-medium text-white mb-3">
                        Privacy Settings
                      </h3>
                      <PreferenceToggle
                        label="Show on-page tracking indicator"
                        description="Display a small badge when tracking is active"
                        enabled={preferences.showTrackingIndicator !== false}
                        onChange={(v) =>
                          updatePreference("showTrackingIndicator", v)
                        }
                      />
                      <PreferenceToggle
                        label="Anonymous tracking"
                        description="Don't associate tracking data with wallet address until mint"
                        enabled={preferences.anonymousTracking !== false}
                        onChange={(v) =>
                          updatePreference("anonymousTracking", v)
                        }
                      />
                      <PreferenceToggle
                        label="Store thumbnails locally"
                        description="Save media thumbnails for offline viewing in history"
                        enabled={preferences.storeThumbnails !== false}
                        onChange={(v) => updatePreference("storeThumbnails", v)}
                      />
                    </div>

                    {/* Data Management */}
                    <div className="border-t border-white/10 pt-4">
                      <h3 className="text-sm font-medium text-white mb-3">
                        Data Management
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={exportData}
                          className="flex items-center justify-center gap-2 p-4 bg-dark/50 rounded-xl 
                                   hover:bg-white/5 transition-colors border border-white/10"
                        >
                          <Download className="w-5 h-5 text-primary-400" />
                          <span className="text-sm text-white">
                            Export Data
                          </span>
                        </button>
                        <button
                          onClick={clearAllData}
                          className="flex items-center justify-center gap-2 p-4 bg-dark/50 rounded-xl 
                                   hover:bg-red-500/10 transition-colors border border-white/10"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                          <span className="text-sm text-red-400">
                            Clear All Data
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="border-t border-white/10 pt-4">
                      <h3 className="text-sm font-medium text-white mb-3">
                        Site Permissions
                      </h3>
                      <p className="text-xs text-white/50 mb-3">
                        Trex requires permission to track media on each site.
                        You can manage these permissions here.
                      </p>
                      <button
                        onClick={() => {
                          chrome.tabs.create({
                            url: "chrome://extensions/?id=" + chrome.runtime.id,
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-dark/50 rounded-xl 
                                 hover:bg-white/5 transition-colors border border-white/10"
                      >
                        <Settings className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">
                          Manage Extension Permissions
                        </span>
                        <ExternalLink className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle component
function PreferenceToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="w-full flex items-center justify-between py-3 px-4 hover:bg-white/5 rounded-xl transition-colors"
    >
      <div className="text-left">
        <span className="text-sm text-white block font-medium">{label}</span>
        <span className="text-xs text-white/40">{description}</span>
      </div>
      <div
        className={`w-12 h-6 rounded-full transition-colors ${
          enabled ? "bg-primary-500" : "bg-white/20"
        } flex items-center`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
            enabled ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
