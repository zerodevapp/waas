"use client"

import { useSyncExternalStore } from "react"
import { type GetChainsReturnType, getChains } from "../actions/getChains"
import { watchChains } from "../actions/watchChains"
import type { Config } from "../createConfig"
import { useConfig } from "./useConfig.js"

export type UseChainsReturnType<config extends Config = Config> =
    GetChainsReturnType<config>

/** https://wagmi.sh/react/api/hooks/useChains */
export function useChains<
    TConfig extends Config = Config
>(): UseChainsReturnType<TConfig> {
    const config = useConfig()

    return useSyncExternalStore(
        (onChange) => watchChains(config, { onChange }),
        () => getChains(config),
        () => getChains(config)
    )
}
