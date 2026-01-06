# Trex Media Tracking Flow

## How Media Tracking Works

### 1. Content Script Injection
- **File**: `s_frontend/src/content/media-tracker.ts`
- **When**: Automatically injected on supported sites via `manifest.json` content_scripts
- **Sites**: YouTube, Netflix, Webtoons, MangaDex, MovieBox, and 30+ other platforms

### 2. Video Detection
The content script detects video playback through multiple methods:

#### A. Event Listeners
```javascript
// Play event - fires when video starts
document.addEventListener("play", (e) => {
  if (el.tagName === "VIDEO" && el.duration > 0) {
    startTracking();
  }
}, true);

// Timeupdate event - fires continuously while playing
document.addEventListener("timeupdate", (e) => {
  if (el.tagName === "VIDEO" && el.duration > 0) {
    startTracking();
  }
}, true);
```

#### B. YouTube-Specific Detection
- URL change monitoring (for SPA navigation)
- History API popstate listener
- Polls every 1 second for URL changes
- Resets session on navigation to new video

#### C. MutationObserver
- Watches for DOM changes
- Debounced tracking initialization (2s delay)
- Catches delayed video element loading

### 3. Data Extraction
**Function**: `extractMediaInfo()`

Extracts:
- **Title**: Platform-specific selectors (YouTube has 10+ fallback selectors)
- **Progress**: Video element currentTime/duration
- **Duration**: Video element duration
- **Thumbnail**: og:image meta tag
- **Platform**: Detected from URL patterns
- **Type**: video/movie/anime/manga/book

### 4. Sending Tracking Updates
**Function**: `sendTrackingUpdate()` / `updateTracking()`

```javascript
chrome.runtime.sendMessage({
  type: "TRACKING_UPDATE",
  data: {
    id: sessionId,
    platform: "youtube",
    type: "video",
    title: "Video Title",
    url: "https://youtube.com/watch?v=...",
    progress: 45,
    duration: 600,
    watchTime: 270,
    completed: false,
    thumbnail: "...",
    // ... more fields
  }
});
```

**Frequency**: Every 5 seconds via `setInterval`

### 5. Background Script Processing
**File**: `s_frontend/src/background/service-worker.ts`

```javascript
case "TRACKING_UPDATE":
  // Store in activeSessions Map
  activeSessions.set(tabId, session);
  
  // Update chrome.storage.local for popup access
  updateActiveTrackingStorage();
```

**Storage Key**: `chrome.storage.local.activeTracking`

### 6. Popup Display
**File**: `s_frontend/src/components/MediaTracker.tsx`

#### A. Load Tracking Data
```javascript
useEffect(() => {
  const result = await chrome.storage.local.get(["activeTracking"]);
  if (result.activeTracking) {
    setActiveTracking(result.activeTracking);
  }
}, []);
```

#### B. Listen for Updates
```javascript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.activeTracking?.newValue) {
    setActiveTracking(changes.activeTracking.newValue);
  }
});
```

#### C. Display Cards
```jsx
{allTrackedMedia.map((media) => (
  <TrackedMediaCard
    key={media.id}
    media={media}
    onMint={media.completed ? () => handleMint(media) : undefined}
    onDismiss={media.completed ? () => handleDismiss(media.id) : undefined}
  />
))}
```

## Current Site Detection

Shows real-time status:
- ✅ **Green**: Currently tracking (video playing)
- 🔵 **Blue**: Site enabled, waiting for media
- 🟡 **Yellow**: Site supported but needs permission
- ⚫ **Gray**: Site not supported

## Troubleshooting

### If Tracking Doesn't Work:

1. **Check Console Logs** (on the website):
   - `[Trex] Content script initialized on: youtube type: video`
   - `[Trex] Video play detected, starting tracking`
   - `[Trex] YouTube title found: ... via ...`

2. **Check Background Console** (Extensions page):
   - `[Trex] Tracking started: Video Title`
   - `[Trex] Tracking update: { title, progress, watchTime }`

3. **Check Storage**:
   ```javascript
   chrome.storage.local.get(['activeTracking'], (r) => console.log(r));
   ```

4. **Common Issues**:
   - Content script not injected → Check manifest.json matches
   - Video not detected → Check selector patterns in SUPPORTED_PLATFORMS
   - No updates → Check if sendMessage is failing
   - Popup not showing → Check storage.onChanged listener

## Testing on YouTube

1. Open YouTube video
2. Open DevTools Console
3. Look for: `[Trex] Content script initialized`
4. Start playing video
5. Look for: `[Trex] Video play detected`
6. Open popup → Should see tracking card with:
   - Video title
   - Progress bar (updates every 5s)
   - Watch time
   - Platform badge

## Data Flow Summary

```
Video Plays
    ↓
Content Script Detects (play/timeupdate event)
    ↓
extractMediaInfo() → Get title, duration, progress
    ↓
sendTrackingUpdate() → chrome.runtime.sendMessage()
    ↓
Background Service Worker → TRACKING_UPDATE handler
    ↓
activeSessions.set(tabId, session)
    ↓
updateActiveTrackingStorage() → chrome.storage.local.set()
    ↓
Popup Component → chrome.storage.onChanged listener
    ↓
setActiveTracking(newValue)
    ↓
TrackedMediaCard renders with progress bar
```

## Completion Detection

Video is marked complete when:
- Progress >= 90%, OR
- Duration - currentTime < 30 seconds

Then shows:
- ✅ Completed badge
- 🎨 Mint NFT button
- 🗑️ Dismiss button
