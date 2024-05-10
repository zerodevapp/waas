import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useConfig as useWagmiConfig } from "wagmi"
import type { SwitchChainErrorType } from "../actions/switchChain"
import type { Config as ZdConfig } from "../createConfig"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type SwitchChainData,
    type SwitchChainMutate,
    type SwitchChainMutateAsync,
    type SwitchChainVariables,
    switchChainMutationOptions
} from "../query/switchChain"
import type { UseMutationParameters } from "../types/query"
import type { UseMutationReturnType } from "../types/query"
import { useConfig as useZdConfig } from "./useConfig"

export type UseSwitchChainParameters<
    TZdConfig extends ZdConfig = ZdConfig,
    context = unknown
> = Evaluate<{
    mutation?:
        | UseMutationParameters<
              SwitchChainData<TZdConfig, TZdConfig["chains"][number]["id"]>,
              SwitchChainErrorType,
              SwitchChainVariables<
                  TZdConfig,
                  TZdConfig["chains"][number]["id"]
              >,
              context
          >
        | undefined
}>

export type UseSwitchChainReturnType<
    TZdConfig extends ZdConfig = ZdConfig,
    context = unknown
> = Evaluate<
    UseMutationReturnType<
        SwitchChainData<TZdConfig, TZdConfig["chains"][number]["id"]>,
        SwitchChainErrorType,
        SwitchChainVariables<TZdConfig, TZdConfig["chains"][number]["id"]>,
        context
    > & {
        switchChain: SwitchChainMutate<TZdConfig, context>
        switchChainAsync: SwitchChainMutateAsync<TZdConfig, context>
    }
>

export function useSwitchChain<
    TZdConfig extends ZdConfig = ZdConfig,
    context = unknown
>(
    parameters: UseSwitchChainParameters<TZdConfig, context> = {}
): UseSwitchChainReturnType<TZdConfig, context> {
    const { mutation } = parameters
    const { setKernelAccountClient, setKernelAccount, setValidator } =
        useSetKernelAccount()
    const { validator, kernelAccountClient } = useKernelAccount()

    const zdConfig = useZdConfig()
    const wagmiConfig = useWagmiConfig()

    const mutationOptions = switchChainMutationOptions(
        zdConfig,
        wagmiConfig,
        validator,
        kernelAccountClient
    )
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
        onSuccess: (data, variables, context) => {
            setKernelAccount(data.kernelAccount)
            setKernelAccountClient(null)
            setValidator(data.kernelValidator)
            mutation?.onSuccess?.(data, variables, context)
        }
    })

    type Return = UseSwitchChainReturnType<TZdConfig, context>

    return {
        ...result,
        switchChain: mutate as Return["switchChain"],
        switchChainAsync: mutateAsync as Return["switchChainAsync"]
    }
}
