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
    set = (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => {
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
