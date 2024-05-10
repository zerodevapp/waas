import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { Config } from "../createConfig"
import { SessionProvider } from "./SessionContext"
import { SocialProvider } from "./SocialContext"
import { WalletConnectProvider } from "./WalletConnectProvider"
import { ZeroDevConfigProvider } from "./ZeroDevConfigContext"
import { ZeroDevValidatorProvider } from "./ZeroDevValidatorContext"

export interface ZeroDevProviderProps {
    config: Config
    children: ReactNode
}

export function ZeroDevProvider({ children, config }: ZeroDevProviderProps) {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <ZeroDevConfigProvider config={config}>
                <ZeroDevValidatorProvider>
                    <SessionProvider>
                        <WalletConnectProvider>
                            <SocialProvider>{children}</SocialProvider>
                        </WalletConnectProvider>
                    </SessionProvider>
                </ZeroDevValidatorProvider>
            </ZeroDevConfigProvider>
        </QueryClientProvider>
    )
}
