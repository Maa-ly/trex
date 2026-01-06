/**
 * Trex Content Script UI Components
 * Extracted HTML/CSS for completion banner and track series button
 * Matches the extension's design system
 */

// ============================================================================
// Shared Styles
// ============================================================================

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`;

const COLORS = {
  primary: "#FF6D75", // Coral
  secondary: "#9D87FF", // Violet light
  accent: "#7C60FD", // Violet
  dark: "#1D212B",
  darkLight: "#292347",
  textPrimary: "#ffffff",
  textSecondary: "#a0aec0",
  textMuted: "#718096",
} as const;

// Main gradient matching extension buttons (bg-main-gradient from tailwind config)
const BUTTON_GRADIENT = `linear-gradient(139.84deg, #FF6D75 50%, #9D87FF 96.42%)`;

// Background gradient for dark cards
const BG_GRADIENT = `linear-gradient(109.28deg, #1D212B 12.96%, #292347 87.04%)`;

// ============================================================================
// Completion Banner Component
// ============================================================================

export interface CompletionBannerProps {
  title: string;
  type: string;
  platform: string;
  giftboxIconUrl: string;
  veryCoinIconUrl: string;
}

export function getCompletionBannerStyles(): string {
  return `
    ${FONT_IMPORT}
    
    #trex-completion-banner {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: ${BG_GRADIENT};
      border: 1px solid rgba(255, 109, 117, 0.3);
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 109, 117, 0.15);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 340px;
      max-width: 400px;
      animation: trexSlideIn 0.3s ease-out;
    }
    
    @keyframes trexSlideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .trex-banner-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .trex-banner-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .trex-banner-icon img {
      width: 48px;
      height: 48px;
    }
    
    .trex-banner-title {
      color: ${COLORS.primary};
      font-weight: 600;
      font-size: 16px;
      margin: 0;
      font-family: 'Outfit', sans-serif;
    }
    
    .trex-banner-subtitle {
      color: ${COLORS.textSecondary};
      font-size: 12px;
      margin: 0;
      font-family: 'Outfit', sans-serif;
    }
    
    .trex-banner-media {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .trex-banner-media-title {
      color: ${COLORS.textPrimary};
      font-weight: 500;
      font-size: 14px;
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: 'Outfit', sans-serif;
    }
    
    .trex-banner-media-type {
      color: ${COLORS.textSecondary};
      font-size: 12px;
      text-transform: capitalize;
      margin: 0;
      font-family: 'Outfit', sans-serif;
    }
    
    .trex-banner-buttons {
      display: flex;
      gap: 10px;
    }
    
    .trex-banner-btn {
      flex: 1;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      font-family: 'Outfit', sans-serif;
    }
    
    .trex-banner-btn-primary {
      background: ${BUTTON_GRADIENT};
      color: ${COLORS.textPrimary};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .trex-banner-btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .trex-banner-btn-primary img {
      width: 18px;
      height: 18px;
    }
    
    .trex-banner-btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: ${COLORS.textSecondary};
    }
    
    .trex-banner-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .trex-banner-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: ${COLORS.textMuted};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .trex-banner-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `;
}

export function getCompletionBannerHTML(props: CompletionBannerProps): string {
  return `
    <style>${getCompletionBannerStyles()}</style>
    
    <button class="trex-banner-close" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    
    <div class="trex-banner-header">
      <div class="trex-banner-icon">
        <img src="${props.giftboxIconUrl}" alt="Achievement" />
      </div>
      <div>
        <p class="trex-banner-title">Completion Detected!</p>
        <p class="trex-banner-subtitle">Trex Achievement</p>
      </div>
    </div>
    
    <div class="trex-banner-media">
      <p class="trex-banner-media-title">${props.title}</p>
      <p class="trex-banner-media-type">${props.type} • ${props.platform}</p>
    </div>
    
    <div class="trex-banner-buttons">
      <button class="trex-banner-btn trex-banner-btn-secondary" onclick="this.closest('#trex-completion-banner').remove()">
        Later
      </button>
      <button class="trex-banner-btn trex-banner-btn-primary" id="trex-mint-btn">
        <img src="${props.veryCoinIconUrl}" alt="" />
        Mint NFT
      </button>
    </div>
  `;
}

// ============================================================================
// Track Series Button Component
// ============================================================================

export interface TrackSeriesButtonStyles {
  clockIconUrl: string;
}

/**
 * Get styles object for Track Series button matching extension design
 * Uses gradient from primary (#FF6D75) to secondary (#9D87FF)
 */
export function getTrackSeriesButtonStyles(): Record<string, string> {
  return {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "999999",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    color: COLORS.textPrimary,
    background: BUTTON_GRADIENT,
    cursor: "pointer",
    fontFamily:
      "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
    fontWeight: "500",
    transform: "translateX(140%)",
    transition: "all 200ms ease-out",
  };
}

export function getTrackSeriesButtonHoverStyles(): Record<string, string> {
  return {
    opacity: "0.9",
    transform: "translateY(-1px)",
  };
}

export function getTrackSeriesButtonDefaultStyles(): Record<string, string> {
  return {
    opacity: "1",
    transform: "translateY(0)",
  };
}

// ============================================================================
// Success Toast Component
// ============================================================================

export function getSuccessToastStyles(): Record<string, string> {
  return {
    position: "fixed",
    bottom: "80px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: COLORS.textPrimary,
    fontFamily:
      "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: "500",
    fontSize: "14px",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
    zIndex: "999999",
    transform: "translateX(100%)",
    opacity: "0",
    transition: "all 300ms ease-out",
  };
}

// ============================================================================
// Utility: Ensure Outfit font is loaded
// ============================================================================

export function ensureOutfitFont(): void {
  if (
    !document.querySelector(
      'link[href*="fonts.googleapis.com/css2?family=Outfit"]'
    )
  ) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
}
