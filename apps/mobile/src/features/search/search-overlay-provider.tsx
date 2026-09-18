import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type SearchOverlayContextValue = {
  isOpen: boolean;
  initialQuery: string;
  sessionKey: number;
  open: (options?: { query?: string }) => void;
  close: () => void;
};

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(
  null,
);

export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [sessionKey, setSessionKey] = useState(0);

  const open = useCallback((options?: { query?: string }) => {
    setInitialQuery(options?.query ?? '');
    setSessionKey((current) => current + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, initialQuery, sessionKey, open, close }),
    [close, initialQuery, isOpen, open, sessionKey],
  );

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
    </SearchOverlayContext.Provider>
  );
}

export function useSearchOverlay(): SearchOverlayContextValue {
  const context = useContext(SearchOverlayContext);
  if (!context) {
    throw new Error('useSearchOverlay must be used within SearchOverlayProvider');
  }
  return context;
}
