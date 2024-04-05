import { ReactNode, createContext, useContext } from "react";
import { type Chain } from "viem";

interface ZeroDevAppContextValue {
  appId: string | null;
  chain: Chain | null;
}

export const ZeroDevAppContext = createContext<ZeroDevAppContextValue>({
  appId: null,
  chain: null,
});

interface ZeroDevAppProviderProps {
  children: ReactNode;
  appId: string | null;
  chain: Chain | null;
}

export function ZeroDevAppProvider({
  children,
  appId,
  chain,
}: ZeroDevAppProviderProps) {
  return (
    <ZeroDevAppContext.Provider
      value={{
        appId,
        chain,
      }}
    >
      {children}
    </ZeroDevAppContext.Provider>
  );
}

export function useZeroDevConfig() {
  const { appId, chain } = useContext(ZeroDevAppContext);

  return { appId, chain };
}
