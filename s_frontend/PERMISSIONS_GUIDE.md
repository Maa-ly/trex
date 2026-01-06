# Chrome Extension Permissions Guide

## Understanding Manifest V3 Permissions

### Types of Permissions

1. **`permissions`** - Automatically granted at install time
   - Example: `storage`, `activeTab`, `notifications`
   - No user interaction required
   
2. **`host_permissions`** - Automatically granted at install time for specific URLs
   - Example: `https://*.trex.io/*`, `http://localhost/*`
   - Shows warning during installation
   
3. **`optional_host_permissions`** - Requested at runtime
   - Example: `https://*.netflix.com/*`, `https://*.youtube.com/*`
   - **CRITICAL**: Must be requested via `chrome.permissions.request()`
   - Only shows dialog when called from a user gesture (button click)

### Why Permission Dialogs Don't Appear

The native Chrome permission dialog may not appear for several reasons:

1. **Permission Already Granted**: If the user previously granted permission, Chrome won't show the dialog again
2. **Popup Context**: Extension popups can close quickly, interrupting the permission flow
3. **Not User Gesture**: Permission request must be in direct response to a click/keyboard event
4. **Permission Format Wrong**: Incorrect pattern in `origins` array

### How Our Extension Handles Permissions

#### Enable Tracking Flow

```typescript
const handleEnableSite = async () => {
  // 1. Check if permission already exists
  const hasPermission = await chrome.permissions.contains({
    origins: [`https://*.${domain}/*`],
  });

  if (hasPermission) {
    // Already granted, just inject script
    injectContentScript();
    return;
  }

  // 2. Request permission (shows native Chrome dialog)
  const granted = await chrome.permissions.request({
    origins: [`https://*.${domain}/*`],
  });

  if (granted) {
    injectContentScript();
  } else {
    // User clicked "Deny" in the dialog
    alert("Permission denied. Enable in chrome://extensions");
  }
};
```

#### Add Custom Site Flow

```typescript
const saveCustomSite = async () => {
  // Same flow: check → request → inject script
  const hasPermission = await chrome.permissions.contains({
    origins: [`https://*.${domain}/*`],
  });

  if (!hasPermission) {
    const granted = await chrome.permissions.request({
      origins: [`https://*.${domain}/*`],
    });
    
    if (!granted) {
      // Permission denied
      alert("Permission denied. Enable in chrome://extensions");
      return;
    }
  }

  // Save site and inject script
  saveSiteToStorage();
  injectContentScript();
};
```

### Manual Permission Management

Users can manually manage permissions at:
```
chrome://extensions → Trex Extension → Details → Site access
```

Options:
- **On click** - Only when user clicks the extension icon (default for optional_host_permissions)
- **On specific sites** - Choose which sites to allow
- **On all sites** - Grant all optional permissions (not recommended)

### Testing Permission Flow

1. **Fresh Install**: Remove and reinstall extension
2. **Check Current Permissions**:
   ```javascript
   chrome.permissions.getAll((permissions) => {
     console.log('Granted origins:', permissions.origins);
   });
   ```
3. **Test Request**: Click "Enable" button on a supported site
4. **Expected**: Native Chrome dialog should appear asking for permission
5. **If No Dialog**: Permission might already be granted or request failed

### Debugging Permission Issues

#### Check if permission exists:
```javascript
const hasPermission = await chrome.permissions.contains({
  origins: ['https://*.netflix.com/*'],
});
console.log('Has Netflix permission:', hasPermission);
```

#### Listen for permission changes:
```javascript
chrome.permissions.onAdded.addListener((permissions) => {
  console.log('Permissions added:', permissions.origins);
});

chrome.permissions.onRemoved.addListener((permissions) => {
  console.log('Permissions removed:', permissions.origins);
});
```

### Best Practices

1. **Always check before requesting**: Use `contains()` first
2. **Provide feedback**: Alert user if permission denied
3. **Document manual steps**: Tell users about chrome://extensions
4. **Request only what's needed**: Don't request `https://*/*`
5. **User gesture required**: Only call `request()` from click handlers

### Common Issues & Solutions

#### Issue: "No permission dialog appears"
**Solution**: Check if permission already granted via `contains()`

#### Issue: "Permission request fails silently"
**Solution**: Ensure called from user gesture, check console for errors

#### Issue: "Can't see optional permissions in chrome://extensions"
**Solution**: They only appear AFTER first request attempt or manual configuration

#### Issue: "Popup closes before permission granted"
**Solution**: This is expected behavior. User must re-open popup after granting permission.

### Related Files

- `manifest.json` - Defines all permission types
- `MediaTracker.tsx` - Implements permission request logic
- `service-worker.ts` - Background permission handling

### References

- [Chrome Extension Permissions](https://developer.chrome.com/docs/extensions/reference/permissions/)
- [Optional Permissions](https://developer.chrome.com/docs/extensions/mv3/permissions/#optional_permissions)
- [Host Permissions](https://developer.chrome.com/docs/extensions/mv3/match_patterns/)
