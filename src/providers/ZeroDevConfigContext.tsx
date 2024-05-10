import { type ReactNode, createContext, useContext } from "react"
import type { Config } from "../createConfig"

interface ZeroDevAppContextValue {
    config: Config | undefined
}

export const ZeroDevConfigContext = createContext<ZeroDevAppContextValue>({
    config: undefined
})

interface ZeroDevConfigProviderProps {
    config: Config
}

export function ZeroDevConfigProvider(
    parameters: React.PropsWithChildren<ZeroDevConfigProviderProps>
) {
    const { children, config } = parameters

    return (
        <ZeroDevConfigContext.Provider
            value={{
                config
            }}
        >
            {children}
        </ZeroDevConfigContext.Provider>
    )
}
