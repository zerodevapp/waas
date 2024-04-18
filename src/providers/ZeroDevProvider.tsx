import { ReactNode } from "react";
import { type Chain } from "wagmi/chains";
import { SessionProvider } from "./SessionContext";
import { ZeroDevAppProvider } from "./ZeroDevAppContext";
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext";
import { WalletConnectProvider } from "./WalletConnectProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export interface ZeroDevProviderProps {
  appId: string | null;
  chain: Chain | null;
  children: ReactNode;
}

export function ZeroDevProvider({
  children,
  appId,
  chain,
}: ZeroDevProviderProps) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ZeroDevAppProvider appId={appId} chain={chain}>
        <ZeroDevValidatorProvider>
          <SessionProvider>
            <WalletConnectProvider>
              {children}
            </WalletConnectProvider>
          </SessionProvider>
        </ZeroDevValidatorProvider>
      </ZeroDevAppProvider>
    </QueryClientProvider>
  );
}
