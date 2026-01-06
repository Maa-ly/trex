# UI & Permission Fixes - Summary

## Changes Made

### 1. Fixed Input White Background Issue ✅

**Problem**: Input fields in Add Custom Site modal were showing white background despite having `bg-dark-light` Tailwind class.

**Root Cause**: Browser default styles and autofill were overriding Tailwind CSS with white backgrounds.

**Solution**: Added CSS overrides in `globals.css`:

```css
/* Force dark backgrounds on all inputs to override browser defaults */
input,
select,
textarea {
  color-scheme: dark;
  background-color: rgba(29, 33, 43, 0.6) !important;
  color: white !important;
}

/* Override autofill background */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px rgba(29, 33, 43, 0.6) inset !important;
  -webkit-text-fill-color: white !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

**Files Modified**:
- `s_frontend/src/styles/globals.css`

---

### 2. Increased Dropdown Blur ✅

**Problem**: Media type dropdown was too transparent and content behind it was too visible.

**Solution**: Enhanced blur effect from no blur to `backdrop-blur-2xl`:

```tsx
// Before:
className="bg-dark-800 border border-dark-600 rounded-xl shadow-xl overflow-hidden"

// After:
className="bg-dark-800/98 backdrop-blur-2xl border border-dark-600 rounded-xl shadow-xl overflow-hidden"
```

**Changes**:
- Changed `bg-dark-800` (100% opacity) to `bg-dark-800/98` (98% opacity)
- Added `backdrop-blur-2xl` for strong glassmorphism effect

**Files Modified**:
- `s_frontend/src/components/CustomDropdown.tsx`

---

### 3. Improved Permission Request Flow ✅

**Problem**: Permission dialogs weren't appearing when enabling sites or adding custom sites.

**Root Cause**: Chrome Manifest V3 has specific requirements for `chrome.permissions.request()`:
1. Must be called from user gesture
2. Doesn't show dialog if permission already granted
3. Can fail silently in popup context

**Solution**: Enhanced permission handling with checks and feedback:

#### Updated `handleEnableSite()`:
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
    // User denied permission
    alert("Permission denied. To enable tracking, please grant site access in chrome://extensions");
  }
};
```

#### Updated `saveCustomSite()`:
```typescript
const saveCustomSite = async () => {
  // Check if permission exists first
  const hasPermission = await chrome.permissions.contains({
    origins: [`https://*.${domain}/*`, `http://*.${domain}/*`],
  });

  let permissionGranted = hasPermission;

  if (!hasPermission) {
    // Request permission
    permissionGranted = await chrome.permissions.request({
      origins: [`https://*.${domain}/*`, `http://*.${domain}/*`],
    });
  }

  if (permissionGranted) {
    // Save site and inject script
  } else {
    alert("Permission denied. To enable tracking for this site, please grant site access in chrome://extensions");
  }
};
```

**Improvements**:
- ✅ Check existing permissions before requesting
- ✅ Provide user feedback when permission denied
- ✅ Handle errors gracefully
- ✅ Added error messages for troubleshooting

**Files Modified**:
- `s_frontend/src/components/MediaTracker.tsx`

---

### 4. Created Permissions Documentation ✅

**Created**: `PERMISSIONS_GUIDE.md` - Comprehensive guide explaining:
- How Manifest V3 permissions work
- Why permission dialogs don't always appear
- How to manually manage permissions
- Debugging permission issues
- Best practices

**File Created**:
- `s_frontend/PERMISSIONS_GUIDE.md`

---

## Testing Instructions

### Test 1: Input Backgrounds
1. Open extension popup
2. Click "+ Add Site" button
3. **Expected**: Input fields should have dark gray background (not white)
4. Type in inputs - background should remain dark
5. Check browser autofill suggestions - should not turn white

### Test 2: Dropdown Blur
1. Open Add Custom Site modal
2. Click on "Media Type" dropdown
3. **Expected**: Dropdown should have strong blur effect
4. Background content should be heavily blurred (not clearly visible)

### Test 3: Permission Flow
1. Navigate to a supported site (e.g., netflix.com)
2. Open extension popup
3. Click "Enable" button
4. **Possible outcomes**:
   - **Dialog appears**: Grant or deny permission
   - **No dialog**: Permission already granted (check chrome://extensions)
   - **Alert appears**: Permission denied - shows manual steps

### Test 4: Custom Site Permissions
1. Navigate to an unsupported site
2. Open extension popup
3. Click "+ Add Site"
4. Fill in site name and domain
5. Click "Save"
6. **Expected**: Permission request or alert with instructions

---

## How to Verify in Chrome DevTools

### Check Input Styles
1. Right-click input field → Inspect
2. Check Computed styles
3. **Expected**: `background-color: rgba(29, 33, 43, 0.6)`
4. Should NOT be `#FFFFFF` (white)

### Check Dropdown Blur
1. Inspect dropdown element
2. Check Computed styles
3. **Expected**: `backdrop-filter: blur(40px)` (from `backdrop-blur-2xl`)

### Check Permissions
Open DevTools Console:
```javascript
// Check current permissions
chrome.permissions.getAll((perms) => {
  console.log('Granted origins:', perms.origins);
});

// Test permission check
chrome.permissions.contains({
  origins: ['https://*.netflix.com/*']
}, (result) => {
  console.log('Has Netflix permission:', result);
});
```

---

## Known Limitations

### Permission Dialogs in Popups
- Chrome extension popups can close quickly, interrupting permission flow
- This is expected Manifest V3 behavior
- Users may need to re-open popup after granting permission

### Optional Permissions Visibility
- Optional permissions don't appear in chrome://extensions until first request
- Users must click "Enable" or "Add Site" at least once
- After first request, permissions can be managed manually

### Autofill Override
- CSS uses `!important` to force dark backgrounds
- May conflict with some password managers
- Should work in 99% of cases

---

## Files Changed

1. `s_frontend/src/styles/globals.css` - Input background overrides
2. `s_frontend/src/components/CustomDropdown.tsx` - Dropdown blur enhancement
3. `s_frontend/src/components/MediaTracker.tsx` - Permission flow improvements
4. `s_frontend/PERMISSIONS_GUIDE.md` - Documentation (new file)

---

## Next Steps

If issues persist:

1. **White inputs**: Clear browser cache and reload extension
2. **No blur**: Check if browser supports `backdrop-filter` CSS property
3. **No permission dialog**: 
   - Check chrome://extensions for existing permissions
   - Try in incognito mode (fresh state)
   - Read PERMISSIONS_GUIDE.md for manual steps

---

## References

- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Permissions API](https://developer.chrome.com/docs/extensions/reference/permissions/)
- [Tailwind CSS Customization](https://tailwindcss.com/docs/customizing-colors)
