import React, { createContext, useContext, useCallback, useRef } from 'react';

type Callback = () => void;
type ContextValue = {
  register: (cb: Callback) => void;
  trigger: () => void;
};

const GlobalRefreshContext = createContext<ContextValue | null>(null);

export const useGlobalRefresh = () => {
  const ctx = useContext(GlobalRefreshContext);
  if (!ctx) throw new Error('GlobalRefreshProvider is not mounted.');
  return ctx;
};

export const useGlobalRefreshTrigger = () => {
  const ctx = useContext(GlobalRefreshContext);
  if (!ctx) throw new Error('GlobalRefreshProvider is not mounted.');
  return ctx.trigger;
};

export const GlobalRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const callbacksRef = useRef<Callback[]>([]);
  const register = useCallback((cb: Callback) => {
    callbacksRef.current.push(cb);
  }, []);
  const trigger = useCallback(() => {
    callbacksRef.current.forEach((cb) => cb());
  }, []);

  return (
    <GlobalRefreshContext.Provider value={{ register, trigger }}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export default GlobalRefreshContext;
