import type { QueryOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import type { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Chain } from "viem"
import {
    type GetKernelClientParameters,
    getKernelClient
} from "../actions/getKernelClient"
import type {
    GetKernelClientErrorType,
    GetKernelClientReturnType
} from "../actions/getKernelClient"
import { ZerodevNotConfiguredError } from "../errors"
import type { ScopeKeyParameter } from "../types"
import { filterQueryOptions } from "./utils"

export type GetKernelClientOptions = Evaluate<
    Partial<GetKernelClientParameters> & ScopeKeyParameter
>

export function getKernelClientQueryOption(
    appId: string | null,
    chain: Chain | null,
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    options: GetKernelClientOptions
) {
    return {
        async queryFn({ queryKey }) {
            const { ...parameters } = queryKey[1]
            if (!appId || !chain) {
                throw new ZerodevNotConfiguredError()
            }
            const kernelClient = getKernelClient(
                appId,
                chain,
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
            appId,
            chain,
            kernelAccount,
            kernelAccountClient,
            entryPoint,
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
    appId: string | null,
    chain: Chain | null,
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    options: GetKernelClientOptions
) {
    return [
        "kernelClient",
        filterQueryOptions(options),
        {
            appId,
            chain,
            kernelAccount,
            kernelAccountClient,
            entryPoint
        }
    ] as const
}

export type GetKernelClientQueryKey = ReturnType<typeof getKernelClientQueryKey>
