import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { Chain } from "wagmi/chains"
import type { Config } from "../createConfig"
import { SessionProvider } from "./SessionContext"
import { SocialProvider } from "./SocialContext"
import { WalletConnectProvider } from "./WalletConnectProvider"
import { ZeroDevAppProvider } from "./ZeroDevAppContext"
import { ZeroDevConfigProvider } from "./ZeroDevConfigContext"
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext"

export interface ZeroDevProviderProps {
    appId: string | null
    chain: Chain | null
    config: Config
    children: ReactNode
}

export function ZeroDevProvider({
    children,
    config,
    appId,
    chain
}: ZeroDevProviderProps) {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <ZeroDevAppProvider appId={appId} chain={chain}>
                <ZeroDevConfigProvider config={config}>
                    <ZeroDevValidatorProvider>
                        <SessionProvider>
                            <WalletConnectProvider>
                                <SocialProvider>{children}</SocialProvider>
                            </WalletConnectProvider>
                        </SessionProvider>
                    </ZeroDevValidatorProvider>
                </ZeroDevConfigProvider>
            </ZeroDevAppProvider>
        </QueryClientProvider>
    )
}
