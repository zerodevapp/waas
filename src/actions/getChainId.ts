import type { Config } from "../createConfig"

export type GetChainIdReturnType<TConfig extends Config = Config> =
    TConfig["chains"][number]["id"]

export function getChainId<TConfig extends Config>(
    config: TConfig
): GetChainIdReturnType<TConfig> {
    return config.state.chainId
}
