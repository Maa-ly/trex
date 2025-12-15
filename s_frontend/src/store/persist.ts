// Persist middleware for Zustand (simplified version)
// In production, use zustand/middleware/persist

export const persist = <T>(config: any, options: any) => {
  return (set: any, get: any, api: any) => {
    const { name, partialize } = options;
    
    // Load from storage
    try {
      const stored = localStorage.getItem(name);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state) {
          set(parsed.state);
        }
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }

    // Save to storage on state changes
    const originalSet = set;
    set = (partial: any, replace?: boolean) => {
      originalSet(partial, replace);
      try {
        const state = get();
        const toStore = partialize ? partialize(state) : state;
        localStorage.setItem(name, JSON.stringify({ state: toStore }));
      } catch (e) {
        console.error('Failed to save to storage:', e);
      }
    };

    return config(set, get, api);
  };
};

