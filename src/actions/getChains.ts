import type { Chain } from "viem"
import type { Config } from "../createConfig"
import { deepEqual } from "../utils/deepEqual"

export type GetChainsReturnType<TConfig extends Config = Config> =
    | TConfig["chains"]
    | readonly [Chain, ...Chain[]]

let previousChains: readonly Chain[] = []

export function getChains<TConfig extends Config>(
    config: TConfig
): GetChainsReturnType<TConfig> {
    const chains = config.chains
    if (deepEqual(previousChains, chains))
        return previousChains as GetChainsReturnType
    previousChains = chains
    return chains
}
