import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

interface PermissionContextValue {
  isOpen: boolean;
  authRevision: number;
  open: () => void;
  close: () => void;
  bumpAuth: () => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const bumpAuth = useCallback(() => setAuthRevision((value) => value + 1), []);
  const value = useMemo(
    () => ({ isOpen, authRevision, open, close, bumpAuth }),
    [isOpen, authRevision, open, close, bumpAuth]
  );

  return <PermissionContext value={value}>{children}</PermissionContext>;
}

export function usePermissionSheet() {
  const context = use(PermissionContext);
  if (!context) {
    throw new Error('usePermissionSheet must be used within PermissionProvider');
  }
  return context;
}
