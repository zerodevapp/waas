import { switchChain as wagmi_switchChain } from "@wagmi/core"
import type { Config as WagmiConfig } from "wagmi"
import type { Config as ZdConfig } from "../createConfig"
import {
    KernelClientNotConnectedError,
    ZerodevNotConfiguredError
} from "../errors"

export type SwitchChainParameters<
    TZdConfig extends ZdConfig = ZdConfig,
    TChainId extends
        TZdConfig["chains"][number]["id"] = TZdConfig["chains"][number]["id"]
> = {
    chainId: TChainId | ZdConfig["chains"][number]["id"]
}

export type SwitchChainReturnType<
    TConfig extends ZdConfig = ZdConfig,
    TChainId extends
        TConfig["chains"][number]["id"] = TConfig["chains"][number]["id"]
> = { id: number }

export type SwitchChainErrorType =
    | ZerodevNotConfiguredError
    | KernelClientNotConnectedError

export async function switchChain<
    TZdConfig extends ZdConfig,
    TChainId extends TZdConfig["chains"][number]["id"]
>(
    zdConfig: TZdConfig,
    wagmiConfig: WagmiConfig,
    parameters: SwitchChainParameters
): Promise<SwitchChainReturnType<TZdConfig, TChainId>> {
    const { chainId } = parameters

    const uid = zdConfig.state.current
    if (!uid) {
        throw new KernelClientNotConnectedError()
    }
    const type = uid.split(":")[0]
    if (type === "ecdsa") {
        await wagmi_switchChain(wagmiConfig, { chainId })
    }
    const chain = zdConfig.chains.find((x) => x.id === chainId)
    if (!chain) {
        throw new ZerodevNotConfiguredError()
    }
    zdConfig.setState((x) => ({ ...x, chainId }))

    return chain as SwitchChainReturnType<TZdConfig, TChainId>
}
