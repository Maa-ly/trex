// Persist middleware for Zustand (simplified version)
// In production, use zustand/middleware/persist

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;
type GetState<T> = () => T;

export const persist = <T>(
  config: (set: SetState<T>, get: GetState<T>, api: any) => T,
  options: { name: string; partialize?: (state: T) => Partial<T> }
) => {
  return (set: SetState<T>, get: GetState<T>, api: any) => {
    const { name, partialize } = options;

    const hasWindow = typeof window !== 'undefined' && !!(window as any).localStorage;
    const isChromeExt = typeof chrome !== 'undefined' && !!chrome.storage?.local;

    // Load from storage
    const load = async () => {
      try {
        if (hasWindow) {
          const stored = window.localStorage.getItem(name);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state) set(parsed.state);
          }
        } else if (isChromeExt) {
          const res = await chrome.storage.local.get([name]);
          const stored = res[name];
          if (stored?.state) set(stored.state);
        }
      } catch (e) {
        console.error('Failed to load from storage:', e);
      }
    };

    // Save to storage on state changes
    const originalSet = set;
    set = (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => {
      originalSet(partial, replace);
      (async () => {
        try {
          const state = get();
          const toStore = partialize ? partialize(state) : state;
          if (hasWindow) {
            window.localStorage.setItem(name, JSON.stringify({ state: toStore }));
          } else if (isChromeExt) {
            await chrome.storage.local.set({ [name]: { state: toStore } });
          }
        } catch (e) {
          console.error('Failed to save to storage:', e);
        }
      })();
    };

    // Initialize
    load();
    return config(set, get, api);
  };
};
