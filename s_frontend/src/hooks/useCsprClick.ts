import { createContext, useContext } from 'react';

interface CsprClickContextValue {
  isInitialized: boolean;
}

export const CsprClickContext = createContext<CsprClickContextValue>({
  isInitialized: false,
});

export const useCsprClick = () => useContext(CsprClickContext);
