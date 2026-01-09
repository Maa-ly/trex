import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Globe,
  CheckCircle,
  AlertCircle,
  Plus,
  Power,
  Film,
  Play,
  Book,
  Tv,
  BookOpen,
  ExternalLink,
  Clock,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { MintNFTModal } from "@/components/MintNFTModal";

// Media type options for custom sites
const MEDIA_TYPES = [
  { value: "movie", label: "Movie" },
  { value: "tvshow", label: "TV Show" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
  { value: "book", label: "Book" },
  { value: "video", label: "Video" },
] as const;

// Custom site interface
interface CustomSite {
  domain: string;
  name: string;
  type: "movie" | "tvshow" | "anime" | "manga" | "book" | "video";
  url?: string;
  enabled?: boolean;
}

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  typeof chrome.tabs !== "undefined";

// Tracked media item interface
interface TrackedMedia {
  id: string;
  platform: string;
  type: string;
  title: string;
  url: string;
  progress: number;
  duration?: number;
  startTime: number;
  lastUpdate: number;
  watchTime: number;
  completed: boolean;
  thumbnail?: string;
}

interface CurrentSiteInfo {
  url: string;
  hostname: string;
  isSupported: boolean;
  platformName: string | null;
  isTracking: boolean;
  isEnabled: boolean;
  domain: string;
}

// Supported platforms with URLs
const SUPPORTED_PLATFORMS: Record<string, { domains: string[]; url: string }> =
  {
    YouTube: { domains: ["youtube.com"], url: "https://youtube.com" },
    Netflix: { domains: ["netflix.com"], url: "https://netflix.com" },
    "Prime Video": {
      domains: ["primevideo.com"],
      url: "https://primevideo.com",
    },
    "Disney+": { domains: ["disneyplus.com"], url: "https://disneyplus.com" },
    Hulu: { domains: ["hulu.com"], url: "https://hulu.com" },
    Crunchyroll: {
      domains: ["crunchyroll.com"],
      url: "https://crunchyroll.com",
    },
    Goodreads: { domains: ["goodreads.com"], url: "https://goodreads.com" },
    MangaDex: { domains: ["mangadex.org"], url: "https://mangadex.org" },
    Webtoons: {
      domains: ["webtoons.com"],
      url: "https://www.webtoons.com/en/",
    },
    MovieBox: { domains: ["moviebox.ph"], url: "https://moviebox.ph" },
    // Filmboom: { domains: ["filmboom.top"], url: "https://filmboom.top" },
  };

// Additional platforms shown in expanded list
const MORE_PLATFORMS: Record<string, { domains: string[]; url: string }> = {
  MyAnimeList: { domains: ["myanimelist.net"], url: "https://myanimelist.net" },
  AniList: { domains: ["anilist.co"], url: "https://anilist.co" },
  "9anime": {
    domains: ["9animetv.to", "9anime.to"],
    url: "https://9animetv.to",
  },
  GogoAnime: {
    domains: ["gogoanime.hu", "gogoanime.gg", "anitaku.to"],
    url: "https://gogoanime.hu",
  },
  HiAnime: { domains: ["hianime.to"], url: "https://hianime.to" },
  AniWave: { domains: ["aniwave.to"], url: "https://aniwave.to" },
  Zoro: { domains: ["zoro.to", "aniwatch.to"], url: "https://zoro.to" },
  AnimePahe: {
    domains: ["animepahe.com", "animepahe.ru"],
    url: "https://animepahe.com",
  },
  Comick: { domains: ["comick.io"], url: "https://comick.io" },
  Mangakakalot: {
    domains: ["mangakakalot.com", "manganato.com"],
    url: "https://mangakakalot.com",
  },
  Fmovies: { domains: ["fmovies.to"], url: "https://fmovies.to" },
  SolarMovie: { domains: ["solarmovie.pe"], url: "https://solarmovie.pe" },
  Hurawatch: { domains: ["hurawatch.tw"], url: "https://hurawatch.tw" },
  Soap2day: { domains: ["soap2day.to"], url: "https://soap2day.to" },
  KissKH: { domains: ["kisskh.id"], url: "https://kisskh.id" },
  DramaCool: { domains: ["dramacool.sr"], url: "https://dramacool.sr" },
  Tapas: { domains: ["tapas.io"], url: "https://tapas.io" },
  Bato: { domains: ["bato.to"], url: "https://bato.to" },
  Twitch: { domains: ["twitch.tv"], url: "https://twitch.tv" },
  Bilibili: { domains: ["bilibili.com"], url: "https://bilibili.com" },
};

// Combined for detection
const ALL_PLATFORMS = { ...SUPPORTED_PLATFORMS, ...MORE_PLATFORMS };

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Play,
  movie: Film,
  tvshow: Tv,
  anime: Play,
  book: Book,
  manga: BookOpen,
};

const platformColors: Record<string, string> = {
  youtube: "from-red-500 to-red-600",
  netflix: "from-red-600 to-red-700",
  primevideo: "from-blue-500 to-blue-600",
  crunchyroll: "from-orange-500 to-orange-600",
  default: "from-primary-500 to-secondary",
};

// Tracked Media Card Component
function TrackedMediaCard({
  media,
  onMint,
  onDismiss,
}: {
  media: TrackedMedia;
  onMint?: () => void;
  onDismiss?: () => void;
}) {
  const Icon = typeIcons[media.type] || Play;
  const colorClass =
    platformColors[media.platform.toLowerCase()] || platformColors.default;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  const formatTimestamp = (
    timestamp: number | string | undefined
  ): string | null => {
    if (!timestamp) return null;
    const time =
      typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
    if (!time || isNaN(time)) return null;
    const diff = Date.now() - time;
    if (diff < 0 || diff > 365 * 24 * 60 * 60 * 1000) return null;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card-glass overflow-hidden p-3"
    >
      <div className="flex gap-3">
        {/* Thumbnail/Icon */}
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
        >
          {media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Icon className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-white truncate text-xs">
              {media.title}
            </h3>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-primary-400 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-2">
            <span className="capitalize">{media.platform}</span>
            <span>•</span>
            <span className="capitalize">{media.type}</span>
            {formatTimestamp(media.lastUpdate) && (
              <>
                <span>•</span>
                <span>{formatTimestamp(media.lastUpdate)}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-white/50">Progress</span>
              <span className="text-white font-medium">
                {Math.round(media.progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-dark/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${media.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Watch Time */}
          {formatTime(media.watchTime) && (
            <div className="flex items-center gap-1 text-[10px] text-white/50">
              <Clock className="w-2.5 h-2.5" />
              <span>Watched: {formatTime(media.watchTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Completed State */}
      {media.completed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Completed!</span>
            </div>
            <div className="flex gap-2">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-2 py-1 text-[10px] text-white/50 hover:text-white 
                           bg-dark/50 rounded-lg hover:bg-dark/80 transition-colors"
                >
                  Dismiss
                </button>
              )}
              {onMint && (
                <button
                  onClick={onMint}
                  className="px-3 py-1 text-[10px] font-medium text-white 
                           bg-gradient-to-r from-primary-500 to-secondary 
                           rounded-lg hover:opacity-90 
                           transition-all duration-200 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Mint NFT
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function MediaTracker({
  onNavigateToSettings,
}: {
  onNavigateToSettings?: () => void;
}) {
  const { isConnected } = useStore();
  const [currentSite, setCurrentSite] = useState<CurrentSiteInfo | null>(null);
  const [activeTracking, setActiveTracking] = useState<TrackedMedia[]>([]);
  const [pendingMints, setPendingMints] = useState<TrackedMedia[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSite, setNewSite] = useState<CustomSite>({
    domain: "",
    name: "",
    type: "movie",
  });
  const [mediaTypeDropdownOpen, setMediaTypeDropdownOpen] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TrackedMedia | null>(null);

  // Detect current active tab site
  useEffect(() => {
    if (!isExtension) return;

    const detectCurrentSite = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs[0];
        if (!tab?.url) return;

        const url = new URL(tab.url);
        const hostname = url.hostname.replace("www.", "");

        let platformName: string | null = null;
        let platformDomain: string = hostname;

        for (const [name, { domains }] of Object.entries(ALL_PLATFORMS)) {
          if (domains.some((p) => hostname.includes(p.replace("www.", "")))) {
            platformName = name;
            const matchingPattern = domains.find((p) =>
              hostname.includes(p.replace("www.", ""))
            );
            if (matchingPattern) {
              platformDomain = matchingPattern.replace("www.", "");
            }
            break;
          }
        }

        // Check custom sites from storage
        if (!platformName) {
          const result = await chrome.storage.local.get(["customSites"]);
          const customSites = result.customSites || [];
          for (const site of customSites) {
            try {
              const siteUrl = new URL(site.url || `https://${site.domain}`);
              const siteDomain = siteUrl.hostname.replace("www.", "");
              if (
                hostname.includes(siteDomain) ||
                siteDomain.includes(hostname)
              ) {
                platformName = site.name || siteDomain;
                platformDomain = siteDomain;
                break;
              }
            } catch {
              const siteDomain = (site.domain || site.url || "")
                .replace(/https?:\/\//, "")
                .replace("www.", "")
                .split("/")[0];
              if (
                hostname.includes(siteDomain) ||
                siteDomain.includes(hostname)
              ) {
                platformName = site.name || siteDomain;
                platformDomain = siteDomain;
                break;
              }
            }
          }
        }

        // Check if we have permission for this domain
        let isEnabled = false;
        if (platformName) {
          const permissions = await chrome.permissions.getAll();
          const origins = permissions.origins || [];
          isEnabled = origins.some((o) => o.includes(platformDomain));
        }

        // Check if tracking is active for this site
        const isCurrentlyTracking = activeTracking.some((t) => {
          const trackingHostname = new URL(t.url).hostname.replace("www.", "");
          return (
            trackingHostname.includes(hostname) ||
            hostname.includes(trackingHostname)
          );
        });

        console.log("[Trex Popup] Current site detection:", {
          hostname,
          platformName,
          isEnabled,
          isTracking: isCurrentlyTracking,
          activeTrackingCount: activeTracking.length,
          activeTrackingUrls: activeTracking.map((t) => t.url),
        });

        setCurrentSite({
          url: tab.url,
          hostname,
          isSupported: platformName !== null,
          platformName,
          isTracking: isCurrentlyTracking,
          isEnabled,
          domain: platformDomain,
        });
      } catch (error) {
        console.error("[Trex] Error detecting current site:", error);
      }
    };

    detectCurrentSite();
  }, [activeTracking]);

  // Load tracking data from storage
  useEffect(() => {
    if (!isExtension) return;

    const loadTrackingData = async () => {
      try {
        const result = await chrome.storage.local.get([
          "activeTracking",
          "pendingMints",
          "trackingEnabled",
        ]);
        console.log("[Trex Popup] Loaded tracking data:", {
          activeTracking: result.activeTracking,
          count: result.activeTracking?.length || 0,
        });
        if (result.activeTracking) {
          setActiveTracking(result.activeTracking);
        }
        if (result.pendingMints) {
          setPendingMints(result.pendingMints);
        }
        if (result.trackingEnabled !== undefined) {
          setTrackingEnabled(result.trackingEnabled);
        }
      } catch (err) {
        console.error("[Trex] Failed to load tracking data:", err);
      }
    };

    loadTrackingData();

    // Poll for updates every 2 seconds (backup for when storage changes don't fire)
    const pollInterval = setInterval(loadTrackingData, 2000);

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      console.log("[Trex Popup] Storage changed:", areaName, changes);
      if (areaName === "local") {
        if (changes.activeTracking?.newValue) {
          console.log(
            "[Trex Popup] Active tracking updated:",
            changes.activeTracking.newValue
          );
          setActiveTracking(changes.activeTracking.newValue);
        }
        if (changes.pendingMints?.newValue) {
          setPendingMints(changes.pendingMints.newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Enable tracking for a supported but disabled site
  const handleEnableSite = async () => {
    if (!currentSite || !isExtension) return;

    try {
      const domain = currentSite.domain;

      // Check if permission already exists
      const hasPermission = await chrome.permissions.contains({
        origins: [`https://*.${domain}/*`],
      });

      if (hasPermission) {
        // Permission already granted, just inject script
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ["src/content/media-tracker.js"],
            });
            console.log("[Trex] Content script injected");
          } catch (err) {
            console.error("[Trex] Failed to inject content script:", err);
          }
        }
        setCurrentSite((prev) => (prev ? { ...prev, isEnabled: true } : null));
        return;
      }

      // Request permission - this MUST be in direct response to user action
      const granted = await chrome.permissions.request({
        origins: [`https://*.${domain}/*`],
      });

      if (granted) {
        // Inject content script into the current tab
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ["src/content/media-tracker.js"],
            });
            console.log("[Trex] Content script injected");
          } catch (err) {
            console.error("[Trex] Failed to inject content script:", err);
          }
        }

        setCurrentSite((prev) => (prev ? { ...prev, isEnabled: true } : null));
      } else {
        console.log("[Trex] Permission denied by user");
        // Show user feedback that permission was denied
        alert(
          "Permission denied. To enable tracking, please grant site access in chrome://extensions"
        );
      }
    } catch (error) {
      console.error("[Trex] Failed to enable tracking:", error);
      // Check if error is due to popup closing
      if (error instanceof Error && error.message.includes("context")) {
        alert(
          "Please try again. The popup closed before permission could be granted."
        );
      }
    }
  };

  // Add custom site handler - show modal
  const handleAddCustomSite = async () => {
    if (!currentSite) return;

    // Pre-fill the domain from current site
    setNewSite({
      domain: currentSite.hostname,
      name:
        currentSite.hostname.split(".")[0].charAt(0).toUpperCase() +
        currentSite.hostname.split(".")[0].slice(1),
      type: "video",
    });
    setShowAddSiteModal(true);
  };

  // Save custom site
  const saveCustomSite = async () => {
    if (!newSite.domain || !newSite.name) return;

    try {
      // Request permission for the domain
      const domain = newSite.domain
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .split("/")[0];

      // Check if permission already exists
      const hasPermission = await chrome.permissions.contains({
        origins: [`https://*.${domain}/*`, `http://*.${domain}/*`],
      });

      let permissionGranted = hasPermission;

      if (!hasPermission) {
        // Request permission - this MUST be in direct response to user action
        permissionGranted = await chrome.permissions.request({
          origins: [`https://*.${domain}/*`, `http://*.${domain}/*`],
        });
      }

      if (permissionGranted) {
        // Get existing custom sites
        const result = await chrome.storage.local.get(["customSites"]);
        const existingSites: CustomSite[] = result.customSites || [];

        // Add new site
        const siteToAdd: CustomSite = {
          ...newSite,
          domain,
          url: `https://${domain}`,
          enabled: true,
        };

        const updatedSites = [...existingSites, siteToAdd];
        await chrome.storage.local.set({ customSites: updatedSites });

        // Inject content script into the current tab if it matches
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id && tabs[0].url?.includes(domain)) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ["src/content/media-tracker.js"],
            });
            console.log("[Trex] Content script injected into custom site");
          } catch (err) {
            console.error("[Trex] Failed to inject content script:", err);
          }
        }

        // Reset and close modal
        setNewSite({ domain: "", name: "", type: "movie" });
        setShowAddSiteModal(false);

        // Update current site info to show it's now supported
        setCurrentSite((prev) =>
          prev
            ? {
                ...prev,
                isSupported: true,
                isEnabled: true,
                platformName: siteToAdd.name,
              }
            : null
        );
      } else {
        console.log("[Trex] Permission not granted for", domain);
        alert(
          "Permission denied. To enable tracking for this site, please grant site access in chrome://extensions"
        );
      }
    } catch (error) {
      console.error("[Trex] Failed to add custom site:", error);
      if (error instanceof Error && error.message.includes("context")) {
        alert(
          "Please try again. The popup closed before permission could be granted."
        );
      }
    }
  };

  const handleMint = (media: TrackedMedia) => {
    setSelectedMedia(media);
    setShowMintModal(true);
  };

  const handleDismiss = (id: string) => {
    setPendingMints((prev) => prev.filter((m) => m.id !== id));
    // Also update storage
    chrome.storage.local.set({
      pendingMints: pendingMints.filter((m) => m.id !== id),
    });
  };

  // Combine active tracking and pending mints
  const allTrackedMedia = [
    ...pendingMints,
    ...activeTracking.filter((t) => !pendingMints.some((p) => p.id === t.id)),
  ];

  return (
    <div className="space-y-4">
      {/* Current Site Indicator */}
      {isExtension && currentSite && isConnected && trackingEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-2.5 rounded-xl border ${
            currentSite.isSupported
              ? currentSite.isTracking
                ? "bg-green-500/10 border-green-500/30"
                : currentSite.isEnabled
                ? "bg-primary-500/10 border-primary-500/30"
                : "bg-yellow-500/10 border-yellow-500/30"
              : "bg-dark/50 border-white/10"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              currentSite.isSupported
                ? currentSite.isTracking
                  ? "bg-green-500/20"
                  : currentSite.isEnabled
                  ? "bg-primary-500/20"
                  : "bg-yellow-500/20"
                : "bg-dark/50"
            }`}
          >
            {currentSite.isSupported ? (
              currentSite.isTracking ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : currentSite.isEnabled ? (
                <Globe className="w-4 h-4 text-primary-400" />
              ) : (
                <Power className="w-4 h-4 text-yellow-400" />
              )
            ) : (
              <AlertCircle className="w-4 h-4 text-white/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {currentSite.platformName || currentSite.hostname}
            </p>
            <p
              className={`text-[10px] ${
                currentSite.isSupported
                  ? currentSite.isTracking
                    ? "text-green-400"
                    : currentSite.isEnabled
                    ? "text-primary-400"
                    : "text-yellow-400"
                  : "text-white/40"
              }`}
            >
              {currentSite.isSupported
                ? currentSite.isTracking
                  ? "Currently tracking"
                  : currentSite.isEnabled
                  ? "Play media to track"
                  : "Enable to track"
                : "Not supported"}
            </p>
          </div>
          {currentSite.isTracking ? (
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          ) : currentSite.isSupported && !currentSite.isEnabled ? (
            <button
              onClick={handleEnableSite}
              className="px-2 py-1 text-[10px] font-medium text-white 
                       bg-yellow-500 rounded-lg hover:bg-yellow-600 
                       transition-colors flex items-center gap-1"
            >
              <Power className="w-3 h-3" />
              Enable
            </button>
          ) : !currentSite.isSupported ? (
            <button
              onClick={handleAddCustomSite}
              className="px-2 py-1 text-[10px] font-medium text-white 
                       bg-gradient-to-r from-primary-500 to-secondary 
                       rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          ) : null}
        </motion.div>
      )}

      {/* Tracking Progress Section */}
      {isConnected && trackingEnabled && allTrackedMedia.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-white">
                Active Tracking
              </h2>
            </div>
            <span className="text-[10px] text-white/50 px-2 py-0.5 bg-dark/50 rounded-full">
              {allTrackedMedia.length} active
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {allTrackedMedia.map((media) => (
                <TrackedMediaCard
                  key={media.id}
                  media={media}
                  onMint={media.completed ? () => handleMint(media) : undefined}
                  onDismiss={
                    media.completed ? () => handleDismiss(media.id) : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary/20 flex items-center justify-center border border-primary-500/30"
          >
            <Activity className="w-8 h-8 text-primary-400" />
          </motion.div>

          <h3 className="text-base font-bold text-white mb-2">
            {isConnected && trackingEnabled
              ? "No Active Tracking"
              : "Track Your Media"}
          </h3>

          <p className="text-white/60 text-xs max-w-xs mx-auto mb-4">
            {isConnected && trackingEnabled
              ? "Visit a supported site like YouTube or Netflix to start tracking your media."
              : "Connect your wallet and visit a supported site to start tracking."}
          </p>

          {isConnected && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Wallet Connected</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Supported Platforms Quick List */}
      {!allTrackedMedia.length && (
        <div className="card-glass p-3">
          <h4 className="text-xs font-medium text-white/80 mb-2">
            Supported Platforms
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SUPPORTED_PLATFORMS).map(([platform, { url }]) => (
              <button
                key={platform}
                onClick={() => {
                  if (isExtension) {
                    chrome.tabs.create({ url });
                  } else {
                    window.open(url, "_blank");
                  }
                }}
                className="px-2 py-0.5 text-[10px] bg-dark/50 text-white/60 rounded-full
                         hover:bg-primary-500/20 hover:text-primary-400 transition-all cursor-pointer"
              >
                {platform}
              </button>
            ))}
            <button
              onClick={() => {
                // Navigate to settings tab using callback or event
                if (onNavigateToSettings) {
                  onNavigateToSettings();
                } else {
                  const event = new CustomEvent("trex-navigate", {
                    detail: { tab: "settings" },
                  });
                  window.dispatchEvent(event);
                }
              }}
              className="px-2 py-0.5 text-[10px] bg-primary-500/20 text-primary-400 rounded-full
                       hover:bg-primary-500/30 transition-all cursor-pointer"
            >
              +{Object.keys(MORE_PLATFORMS).length} more
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Site Modal */}
      <AnimatePresence>
        {showAddSiteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddSiteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-dark-lighter border border-white/10 rounded-2xl p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Add Custom Site
                </h3>
                <button
                  onClick={() => setShowAddSiteModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

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
                    className="trex-transparent-input w-full px-3 py-2 rounded-lg text-xs text-white 
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
                    className="trex-transparent-input w-full px-3 py-2 rounded-lg text-xs text-white 
                             border border-white/10 focus:border-primary-400 outline-none
                             placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/50 mb-1 block">
                    Media Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setMediaTypeDropdownOpen(!mediaTypeDropdownOpen)
                      }
                      className="w-full px-3 py-2 bg-dark rounded-lg text-xs text-white 
                               border border-white/10 focus:border-primary-400 outline-none
                               flex items-center justify-between"
                    >
                      <span className="capitalize">{newSite.type}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-white/40 transition-transform ${
                          mediaTypeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {mediaTypeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 glass-dark
                                   rounded-lg overflow-hidden z-10 shadow-xl shadow-black/20"
                        >
                          {MEDIA_TYPES.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                setNewSite({ ...newSite, type: type.value });
                                setMediaTypeDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors
                                ${
                                  newSite.type === type.value
                                    ? "bg-primary-500/20 text-primary-400"
                                    : "text-white/80"
                                }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-[9px] text-white/40 leading-relaxed">
                  Adding this site will request browser permission to track
                  media on this domain.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddSiteModal(false)}
                    className="flex-1 py-2 text-xs text-white/60 hover:text-white 
                             bg-dark/50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCustomSite}
                    disabled={!newSite.domain || !newSite.name}
                    className="flex-1 py-2 bg-gradient-to-r from-primary-500 to-secondary text-white 
                             text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                             hover:opacity-90 transition-opacity"
                  >
                    Add & Enable
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mint NFT Modal */}
      {selectedMedia && (
        <MintNFTModal
          media={{
            id: selectedMedia.id,
            externalId: selectedMedia.url,
            title: selectedMedia.title,
            type: selectedMedia.type as any,
            description: `Completed on ${new Date(
              selectedMedia.lastUpdate
            ).toLocaleDateString()}`,
            coverImage: selectedMedia.thumbnail || "",
            releaseYear: new Date().getFullYear(),
            creator: selectedMedia.platform,
            genre: [selectedMedia.type],
            totalCompletions: 0,
          }}
          isOpen={showMintModal}
          onClose={() => {
            setShowMintModal(false);
            setSelectedMedia(null);
          }}
          onSuccess={() => {
            handleDismiss(selectedMedia.id);
            setShowMintModal(false);
            setSelectedMedia(null);
          }}
        />
      )}
    </div>
  );
}
