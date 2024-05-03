import { type GetChainIdReturnType, getChainId } from "../actions/getChainId"
import { watchChainId } from "../actions/watchChainId"
import type { Config } from "../createConfig"
import { useConfig } from "./useConfig"

import { useSyncExternalStore } from "react"

export type UseChainIdReturnType<TConfig extends Config = Config> =
    GetChainIdReturnType<TConfig>

export function useChainId<
    TConfig extends Config = Config
>(): UseChainIdReturnType<TConfig> {
    const config = useConfig()

    return useSyncExternalStore(
        (onChange) => watchChainId(config, { onChange }),
        () => getChainId(config),
        () => getChainId(config)
    )
}
