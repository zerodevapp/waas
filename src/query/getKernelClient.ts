import type { QueryOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import type { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    type GetKernelClientParameters,
    getKernelClient
} from "../actions/getKernelClient"
import type {
    GetKernelClientErrorType,
    GetKernelClientReturnType
} from "../actions/getKernelClient"
import type { Config } from "../createConfig"
import type { ScopeKeyParameter } from "../types"
import { filterQueryOptions } from "./utils"

export type GetKernelClientOptions = Evaluate<
    Partial<GetKernelClientParameters> & ScopeKeyParameter
>

export function getKernelClientQueryOption(
    config: Config,
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    chainId: number | null,
    options: GetKernelClientOptions
) {
    return {
        async queryFn({ queryKey }) {
            const { ...parameters } = queryKey[1]
            const kernelClient = getKernelClient(
                config,
                kernelAccountClient,
                kernelAccount,
                entryPoint,
                {
                    ...(parameters as GetKernelClientParameters)
                }
            )
            return kernelClient ?? null
        },
        queryKey: getKernelClientQueryKey(
            kernelAccount,
            kernelAccountClient,
            entryPoint,
            chainId,
            options
        )
    } as const satisfies QueryOptions<
        GetKernelClientQueryFnData,
        GetKernelClientErrorType,
        GetKernelClientData,
        GetKernelClientQueryKey
    >
}

export type GetKernelClientQueryFnData = Evaluate<GetKernelClientReturnType>

export type GetKernelClientData = GetKernelClientQueryFnData

export function getKernelClientQueryKey(
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    chainId: number | null,
    options: GetKernelClientOptions
) {
    return [
        "kernelClient",
        filterQueryOptions(options),
        {
            chainId,
            kernelAccount,
            kernelAccountClient
        }
    ] as const
}

export type GetKernelClientQueryKey = ReturnType<typeof getKernelClientQueryKey>
