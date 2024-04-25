import { type ReactNode, createContext, useContext } from "react"
import { http, type Chain, type PublicClient, createPublicClient } from "viem"
import { ZERODEV_BUNDLER_URL } from "../utils"

interface ZeroDevAppContextValue {
    appId: string | null
    chain: Chain | null
    client: PublicClient | null
}

export const ZeroDevAppContext = createContext<ZeroDevAppContextValue>({
    appId: null,
    chain: null,
    client: null
})

interface ZeroDevAppProviderProps {
    children: ReactNode
    appId: string | null
    chain: Chain | null
}

export function ZeroDevAppProvider({
    children,
    appId,
    chain
}: ZeroDevAppProviderProps) {
    const client =
        chain &&
        createPublicClient({
            chain: chain,
            transport: http(`${ZERODEV_BUNDLER_URL}/${appId}`)
        })
    return (
        <ZeroDevAppContext.Provider
            value={{
                appId,
                chain,
                client
            }}
        >
            {children}
        </ZeroDevAppContext.Provider>
    )
}

export function useZeroDevConfig() {
    const { appId, chain, client } = useContext(ZeroDevAppContext)

    return { appId, chain, client }
}
