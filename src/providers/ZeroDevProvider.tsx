import { ReactNode } from "react";
import { type Chain } from "viem";
import { SessionProvider } from "./SessionContext";
import { ZeroDevAppProvider } from "./ZeroDevAppContext";
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export interface ZeroDevWaasProviderProps {
  appId: string | null;
  chain: Chain | null;
  children: ReactNode;
}

export function ZeroDevProvider({
  children,
  appId,
  chain,
}: ZeroDevWaasProviderProps) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ZeroDevAppProvider appId={appId} chain={chain}>
        <ZeroDevValidatorProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ZeroDevValidatorProvider>
      </ZeroDevAppProvider>
    </QueryClientProvider>
  );
}
