# How to Debug Trex Media Tracking

## The Console Logs You're Seeing Are NOT Trex Errors

The errors you posted:
```
POST https://www.youtube.com/youtubei/v1/log_event?alt=json net::ERR_BLOCKED_BY_CLIENT
ublock-filters.json-prune-fetch-response.js:1
```

These are from **uBlock Origin** (ad blocker) blocking YouTube tracking requests. They are NORMAL and not related to Trex at all.

## How to See Trex Logs

### Method 1: Filter Console by "Trex"

1. Open YouTube video
2. Open DevTools (F12)
3. Go to Console tab
4. In the filter box at the top, type: `Trex`
5. You should see:
   ```
   [Trex] Content script loaded on: https://www.youtube.com/watch?v=...
   [Trex] Content script initialized on: youtube type: video
   [Trex] Video play detected, starting tracking
   [Trex] YouTube title found: ... via ...
   ```

### Method 2: Clear Console First

1. Open YouTube
2. Open DevTools Console
3. Click the "Clear console" button (🚫 icon)
4. In filter, type: `Trex`
5. Reload the page
6. Play a video
7. Watch for Trex logs

### Method 3: Check in Different Order

Sometimes content scripts load before you open DevTools. Try this:

1. **Close** the YouTube tab completely
2. Open DevTools in a **new tab** first
3. Then navigate to YouTube
4. The content script will log immediately
5. Filter by `Trex`

## What You Should See

### On Page Load:
```javascript
[Trex] Content script loaded on: https://www.youtube.com/watch?v=xxxxx
[Trex] Content script initialized on: youtube type: video
[Trex] Attempting initial video tracking...
```

### When Video Plays:
```javascript
[Trex] Video play detected, starting tracking
[Trex] YouTube title found: Video Title Here via ytd-watch-metadata h1.ytd-watch-metadata yt-formatted-string
[Trex] Starting media tracking: {platform: "youtube", type: "video", ...}
```

### Every 5 Seconds While Playing:
```javascript
[Trex] Video element found: {duration: 600, currentTime: 25, progress: 4.17}
```

## If You Don't See Any [Trex] Logs

### Check 1: Is the Content Script Injected?

Open DevTools → Sources tab → Content scripts → Look for `media-tracker.ts`

If you DON'T see it, the script isn't loading.

### Check 2: Manifest Permissions

1. Go to `chrome://extensions`
2. Find Trex extension
3. Click "Details"
4. Scroll to "Site access"
5. Make sure it says "On specific sites" and includes youtube.com

### Check 3: Reload Extension

1. Go to `chrome://extensions`
2. Find Trex extension
3. Click the reload button (🔄)
4. Close ALL YouTube tabs
5. Open fresh YouTube tab
6. Try again

### Check 4: Check Background Script Console

1. Go to `chrome://extensions`
2. Find Trex extension
3. Click "service worker" link (blue text)
4. A new DevTools window opens for background script
5. Check for errors there
6. Try: `chrome.storage.local.get(['activeTracking'], console.log)`

## Common Issues

### Issue: "No [Trex] logs at all"
**Solution**: 
- Extension not loaded → Reload extension
- Wrong tab → Make sure DevTools is attached to YouTube tab, not extension popup
- Permissions missing → Check chrome://extensions site access

### Issue: "Script loads but no tracking"
**Solution**:
- Video not detected → Make sure video is actually playing (not paused)
- Check background console for TRACKING_UPDATE messages
- Check storage: `chrome.storage.local.get(['activeTracking'], console.log)`

### Issue: "[Trex] logs show but popup has no cards"
**Solution**:
- Check background script is receiving updates
- Check `chrome.storage.local.activeTracking` has data
- Check popup console for errors when loading tracking data

## Test Sequence

1. **Reload extension** at chrome://extensions
2. **Close all YouTube tabs**
3. **Open new YouTube tab** with DevTools already open
4. **Filter console** by "Trex"
5. **Navigate to a video**
6. **Look for**: `[Trex] Content script loaded`
7. **Play the video**
8. **Look for**: `[Trex] Video play detected`
9. **Open extension popup**
10. **Should see**: Tracking card with progress bar

## Expected Flow

```
Page Loads → [Trex] Content script loaded
    ↓
Init Runs → [Trex] Content script initialized on: youtube
    ↓
Video Plays → [Trex] Video play detected, starting tracking
    ↓
Title Found → [Trex] YouTube title found: ...
    ↓
Every 5s → Background receives TRACKING_UPDATE
    ↓
Storage Updated → chrome.storage.local.activeTracking
    ↓
Popup Reads → Displays TrackedMediaCard
```

## Quick Debug Commands

Run these in YouTube page console:

```javascript
// Check if content script variables exist
typeof SUPPORTED_PLATFORMS
// Should return: "object"

// Check if video element exists
document.querySelector('video')
// Should return: <video> element

// Check current platform detection
// (You need to copy the detectPlatform function to test this)
```

Run these in background console (click "service worker" at chrome://extensions):

```javascript
// Check active tracking sessions
chrome.storage.local.get(['activeTracking'], (r) => console.log(r))

// Check if background received any updates
// (Should show if activeSessions Map has entries)
```

## Still Not Working?

If after all this you don't see `[Trex]` logs:

1. **Check manifest.json** content_scripts matches includes:
   ```json
   "https://*.youtube.com/*",
   "https://youtube.com/*"
   ```

2. **Verify extension ID hasn't changed** (reload can change it)

3. **Try incognito mode** (to rule out conflicts with other extensions)

4. **Check for CSP errors** in console that might block script injection

5. **Verify the dist folder** has media-tracker.ts after build
