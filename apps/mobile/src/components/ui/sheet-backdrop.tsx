import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { useAppTheme } from '../../providers/theme-provider';
import { SheetBackdropLayer } from './sheet-backdrop-layer';

const SheetBackdropContext = createContext<
  ((id: string, open: boolean) => void) | null
>(null);

export function SheetBackdropProvider({ children }: { children: ReactNode }) {
  const [sheets, setSheets] = useState<ReadonlySet<string>>(() => new Set());
  const palette = useAppTheme();
  const update = useCallback((id: string, open: boolean) => {
    setSheets((current) => {
      if (current.has(id) === open) return current;
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return (
    <SheetBackdropContext.Provider
      value={Platform.OS === 'web' ? update : null}
    >
      <SheetBackdropLayer open={sheets.size > 0} color={palette.modalDimmer} />
      {children}
    </SheetBackdropContext.Provider>
  );
}

export function useSharedSheetBackdrop(open: boolean) {
  const update = useContext(SheetBackdropContext);
  const id = useId();
  useLayoutEffect(() => {
    if (!update || !open) return;
    update(id, true);
    return () => update(id, false);
  }, [id, open, update]);
  return update !== null;
}
