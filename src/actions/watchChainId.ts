import type { Config } from "../createConfig"
import type { GetChainIdReturnType } from "./getChainId"

export type WatchChainIdParameters<TConfig extends Config = Config> = {
    onChange(
        chainId: GetChainIdReturnType<TConfig>,
        prevChainId: GetChainIdReturnType<TConfig>
    ): void
}

export type WatchChainIdReturnType = () => void

export function watchChainId<TConfig extends Config>(
    config: TConfig,
    parameters: WatchChainIdParameters<TConfig>
): WatchChainIdReturnType {
    const { onChange } = parameters
    return config.subscribe((state) => state.chainId, onChange)
}
