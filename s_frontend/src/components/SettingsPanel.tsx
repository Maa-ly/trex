import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Info,
} from "lucide-react";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  typeof chrome.tabs !== "undefined";

// Supported platforms list with URLs
const SUPPORTED_PLATFORMS: Record<string, { domains: string[]; url: string }> =
  {
    // Streaming Services
    Netflix: { domains: ["netflix.com"], url: "https://netflix.com" },
    "Prime Video": {
      domains: ["primevideo.com", "amazon.com/video"],
      url: "https://primevideo.com",
    },
    "Disney+": { domains: ["disneyplus.com"], url: "https://disneyplus.com" },
    Hulu: { domains: ["hulu.com"], url: "https://hulu.com" },
    Crunchyroll: {
      domains: ["crunchyroll.com"],
      url: "https://crunchyroll.com",
    },
    // YouTube & Music
    YouTube: { domains: ["youtube.com"], url: "https://youtube.com" },
    // Manga & Comics
    Webtoons: {
      domains: ["webtoons.com"],
      url: "https://www.webtoons.com/en/",
    },
    MangaDex: { domains: ["mangadex.org"], url: "https://mangadex.org" },
    Tapas: { domains: ["tapas.io"], url: "https://tapas.io" },
    Comick: { domains: ["comick.io"], url: "https://comick.io" },
    // Books
    Goodreads: { domains: ["goodreads.com"], url: "https://goodreads.com" },
    Kindle: { domains: ["read.amazon.com"], url: "https://read.amazon.com" },
    // Anime
    HiAnime: { domains: ["hianime.to"], url: "https://hianime.to" },
    AniWave: { domains: ["aniwave.to"], url: "https://aniwave.to" },
    "9anime": { domains: ["9animetv.to"], url: "https://9animetv.to" },
    GogoAnime: { domains: ["gogoanime.hu"], url: "https://gogoanime.hu" },
    // Movies (Free)
    MovieBox: { domains: ["moviebox.ph"], url: "https://moviebox.ph" },
    Fmovies: { domains: ["fmovies.to"], url: "https://fmovies.to" },
    SolarMovie: { domains: ["solarmovie.pe"], url: "https://solarmovie.pe" },
    // More
    MyAnimeList: {
      domains: ["myanimelist.net"],
      url: "https://myanimelist.net",
    },
    AniList: { domains: ["anilist.co"], url: "https://anilist.co" },
    Twitch: { domains: ["twitch.tv"], url: "https://twitch.tv" },
    Bilibili: { domains: ["bilibili.com"], url: "https://bilibili.com" },
    Mangakakalot: {
      domains: ["mangakakalot.com"],
      url: "https://mangakakalot.com",
    },
    Manganato: { domains: ["manganato.com"], url: "https://manganato.com" },
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
  options: { value: string; label: string }[];
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
        className="w-full px-3 py-2 bg-transparent rounded-lg text-xs text-white border border-white/10 
                   focus:border-primary-400 outline-none flex items-center justify-between"
      >
        <span>{selectedOption?.label || "Select type"}</span>
        <ChevronDown
          className={`w-3 h-3 text-white/50 transition-transform ${
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
            className="absolute top-full left-0 right-0 mt-1 bg-dark-light/95 backdrop-blur-xl border border-white/10 
                       rounded-lg overflow-hidden z-50 shadow-xl"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors
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

export function SettingsPanel() {
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
  const [showPlatforms, setShowPlatforms] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (isExtension) {
      chrome.storage.local.get(
        ["trackingPreferences", "customSites"],
        (result) => {
          if (result.trackingPreferences) {
            setPreferences(result.trackingPreferences);
          }
          if (result.customSites) {
            setCustomSites(result.customSites);
          }
        }
      );
    }
  }, []);

  // Save preferences
  const updatePreference = (key: keyof TrackingPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    if (isExtension) {
      chrome.storage.local.set({ trackingPreferences: newPrefs });
    }
  };

  // Add custom site
  const addCustomSite = () => {
    if (!newSite.domain || !newSite.name) return;

    const updated = [...customSites, newSite];
    setCustomSites(updated);
    if (isExtension) {
      chrome.storage.local.set({ customSites: updated });
    }
    setNewSite({ domain: "", name: "", type: "movie" });
    setShowAddSite(false);
  };

  // Remove custom site
  const removeCustomSite = (domain: string) => {
    const updated = customSites.filter((s) => s.domain !== domain);
    setCustomSites(updated);
    if (isExtension) {
      chrome.storage.local.set({ customSites: updated });
    }
  };

  // Open platform URL
  const openPlatform = (url: string) => {
    if (isExtension) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tracking Preferences */}
      <div className="card-glass p-3">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-medium text-white">
            Tracking Preferences
          </h3>
        </div>

        <div className="space-y-2">
          <PreferenceToggle
            label="Auto-track media"
            description="Automatically start tracking on supported sites"
            enabled={preferences.autoTrack}
            onChange={(v) => updatePreference("autoTrack", v)}
          />
          <PreferenceToggle
            label="Show notifications"
            description="Notify when media is ready to mint"
            enabled={preferences.notifications}
            onChange={(v) => updatePreference("notifications", v)}
          />
          <PreferenceToggle
            label="Auto-mint NFTs"
            description="Automatically mint when complete (requires gas)"
            enabled={preferences.autoMint}
            onChange={(v) => updatePreference("autoMint", v)}
          />
        </div>
      </div>

      {/* Supported Platforms */}
      <div className="card-glass p-3">
        <button
          onClick={() => setShowPlatforms(!showPlatforms)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-medium text-white">
              Supported Platforms
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/50">
              {Object.keys(SUPPORTED_PLATFORMS).length} platforms
            </span>
            <ChevronRight
              className={`w-4 h-4 text-white/40 transition-transform ${
                showPlatforms ? "rotate-90" : ""
              }`}
            />
          </div>
        </button>

        {showPlatforms && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 space-y-1 max-h-48 overflow-y-auto"
          >
            {Object.entries(SUPPORTED_PLATFORMS).map(
              ([name, { domains, url }]) => (
                <button
                  key={name}
                  onClick={() => openPlatform(url)}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg 
                         hover:bg-primary-500/10 hover:border-primary-500/30 border border-transparent
                         transition-all group cursor-pointer"
                >
                  <span className="text-xs text-white/80 group-hover:text-primary-400 transition-colors">
                    {name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">
                      {domains[0]}
                    </span>
                    <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-primary-400 transition-colors" />
                  </div>
                </button>
              )
            )}
          </motion.div>
        )}
      </div>

      {/* Custom Sites */}
      <div className="card-glass p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-medium text-white">Custom Sites</h3>
          </div>
          <button
            onClick={() => setShowAddSite(true)}
            className="text-[10px] px-2 py-0.5 bg-dark/50 text-primary-400 rounded-full
                     hover:bg-primary-500/20 hover:text-primary-400 transition-all cursor-pointer"
          >
            + Add Site
          </button>
        </div>

        {customSites.length > 0 ? (
          <div className="space-y-2">
            {customSites.map((site) => (
              <div
                key={site.domain}
                className="flex items-center justify-between py-2 px-2 bg-dark-light/50 rounded-lg
                         hover:bg-primary-500/10 hover:border-primary-500/30 border border-transparent
                         transition-all group cursor-pointer"
                onClick={() =>
                  openPlatform(site.url || `https://${site.domain}`)
                }
              >
                <div>
                  <span className="text-xs text-white group-hover:text-primary-400 transition-colors">
                    {site.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">
                      {site.domain}
                    </span>
                    <span className="text-[10px] text-primary-400/60 capitalize">
                      • {site.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomSite(site.domain);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-white/40 text-center py-2">
            No custom sites added
          </p>
        )}

        {/* Add Site Modal */}
        {showAddSite && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 bg-dark-light rounded-xl border border-white/10"
          >
            <h4 className="text-xs font-medium text-white mb-3">
              Add Custom Site
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">
                  Site Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., MyAnime"
                  value={newSite.name}
                  onChange={(e) =>
                    setNewSite({ ...newSite, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-transparent rounded-lg text-xs text-white 
                           border border-white/10 focus:border-primary-400 outline-none
                           placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">
                  Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g., myanime.com"
                  value={newSite.domain}
                  onChange={(e) =>
                    setNewSite({ ...newSite, domain: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-transparent rounded-lg text-xs text-white 
                           border border-white/10 focus:border-primary-400 outline-none
                           placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">
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
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddSite(false)}
                  className="flex-1 py-2 text-xs text-white/60 hover:text-white 
                           bg-dark/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomSite}
                  disabled={!newSite.domain || !newSite.name}
                  className="flex-1 py-2 bg-gradient-to-r from-primary-500 to-secondary text-white 
                           text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                           hover:opacity-90 transition-opacity"
                >
                  Add Site
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={() => {
            if (isExtension) {
              chrome.tabs.create({
                url: chrome.runtime.getURL("src/options/index.html"),
              });
            } else {
              window.open("http://localhost:5173/profile", "_blank");
            }
          }}
          className="w-full flex items-center justify-between p-3 card-glass hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-white">Full Settings</span>
          </div>
          <ExternalLink className="w-3 h-3 text-white/40" />
        </button>

        <a
          href="http://localhost:5173"
          target="_blank"
          className="flex items-center justify-between p-3 card-glass hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-white">Open Dashboard</span>
          </div>
          <ChevronRight className="w-3 h-3 text-white/40" />
        </a>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
        <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/60 leading-relaxed">
          Trex tracks your media consumption locally and lets you mint
          achievement NFTs on the Casper blockchain. Your data stays on your
          device.
        </p>
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
      className="w-full flex items-center justify-between py-2 hover:bg-white/5 rounded-lg px-2 transition-colors"
    >
      <div className="text-left">
        <span className="text-xs text-white block">{label}</span>
        <span className="text-[10px] text-white/40">{description}</span>
      </div>
      <div
        className={`w-8 h-5 rounded-full transition-colors ${
          enabled ? "bg-primary-500" : "bg-white/20"
        } flex items-center`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
