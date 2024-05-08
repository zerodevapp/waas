import type { MutateOptions, MutationOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import type { KernelValidator } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Config as WagmiConfig } from "wagmi"
import {
    type SwitchChainErrorType,
    type SwitchChainParameters,
    type SwitchChainReturnType,
    switchChain
} from "../actions/switchChain"
import type { Config as ZdConfig } from "../createConfig"

export function switchChainMutationOptions<TZdConfig extends ZdConfig>(
    zdConfig: TZdConfig,
    wagmiConfig: WagmiConfig,
    kernelValidator: KernelValidator<EntryPoint> | null
) {
    return {
        mutationFn(variables) {
            return switchChain(
                zdConfig,
                wagmiConfig,
                kernelValidator,
                variables
            )
        },
        mutationKey: ["switchChain"]
    } as const satisfies MutationOptions<
        SwitchChainData<TZdConfig, TZdConfig["chains"][number]["id"]>,
        SwitchChainErrorType,
        SwitchChainVariables<TZdConfig, TZdConfig["chains"][number]["id"]>
    >
}

export type SwitchChainData<
    TZdConfig extends ZdConfig,
    TChainId extends TZdConfig["chains"][number]["id"]
> = Evaluate<SwitchChainReturnType<TZdConfig, TChainId>>

export type SwitchChainVariables<
    TZdConfig extends ZdConfig,
    TChainId extends TZdConfig["chains"][number]["id"]
> = Evaluate<SwitchChainParameters<TZdConfig, TChainId>>

export type SwitchChainMutate<TZdConfig extends ZdConfig, context = unknown> = <
    TChainId extends TZdConfig["chains"][number]["id"]
>(
    variables: SwitchChainVariables<TZdConfig, TChainId>,
    options?: Evaluate<
        MutateOptions<
            SwitchChainData<TZdConfig, TChainId>,
            SwitchChainErrorType,
            Evaluate<SwitchChainVariables<TZdConfig, TChainId>>,
            context
        >
    >
) => void

export type SwitchChainMutateAsync<
    TZdConfig extends ZdConfig,
    context = unknown
> = <TChainId extends TZdConfig["chains"][number]["id"]>(
    variables: SwitchChainVariables<TZdConfig, TChainId>,
    options?:
        | Evaluate<
              MutateOptions<
                  SwitchChainData<TZdConfig, TChainId>,
                  SwitchChainErrorType,
                  Evaluate<SwitchChainVariables<TZdConfig, TChainId>>,
                  context
              >
          >
        | undefined
) => Promise<SwitchChainData<TZdConfig, TChainId>>
