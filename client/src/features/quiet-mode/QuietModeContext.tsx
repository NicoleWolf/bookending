import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppNotification } from '../notifications/data';

interface QuietModeContextValue {
  isQuiet:      boolean;
  enter:        () => void;
  exit:         () => void;
  deferred:     AppNotification[];
  addDeferred:  (n: AppNotification) => void;
  clearDeferred: () => void;
}

const Ctx = createContext<QuietModeContextValue | null>(null);

export function QuietModeProvider({ children }: { children: ReactNode }) {
  const [isQuiet,  setIsQuiet]  = useState(false);
  const [deferred, setDeferred] = useState<AppNotification[]>([]);

  const enter         = useCallback(() => setIsQuiet(true), []);
  const exit          = useCallback(() => setIsQuiet(false), []);
  const addDeferred   = useCallback((n: AppNotification) => setDeferred(p => [...p, n]), []);
  const clearDeferred = useCallback(() => setDeferred([]), []);

  return (
    <Ctx.Provider value={{ isQuiet, enter, exit, deferred, addDeferred, clearDeferred }}>
      {children}
    </Ctx.Provider>
  );
}

export function useQuietMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useQuietMode must be used within QuietModeProvider');
  return ctx;
}
