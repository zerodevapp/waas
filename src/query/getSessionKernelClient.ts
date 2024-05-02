import type { QueryOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import type { KernelValidator } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Address, Chain } from "viem"
import {
    type GetSessionKernelClientErrorType,
    type GetSessionKernelClientParameters,
    type GetSessionKernelClientReturnType,
    getSessionKernelClient
} from "../actions/getSessionKernelClient"
import {
    KernelClientNotConnectedError,
    ZerodevNotConfiguredError
} from "../errors"
import type { ScopeKeyParameter, SessionType } from "../types"
import { filterQueryOptions } from "./utils"

export type GetSessionKernelClientOptions = Evaluate<
    Partial<GetSessionKernelClientParameters> & ScopeKeyParameter
>

export function getSessionKernelClientQueryOption(
    appId: string | null,
    chain: Chain | null,
    validator: KernelValidator<EntryPoint> | null,
    kernelAddress: Address | undefined,
    entryPoint: EntryPoint | null,
    session: SessionType | null,
    options: GetSessionKernelClientOptions
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey, ...parameters } = queryKey[1]
            if (!appId || !chain) {
                throw new ZerodevNotConfiguredError()
            }
            if (!kernelAddress || !validator || !entryPoint) {
                throw new KernelClientNotConnectedError()
            }
            const kernelClient = getSessionKernelClient(
                appId,
                chain,
                validator,
                kernelAddress,
                entryPoint,
                session,
                {
                    ...(parameters as GetSessionKernelClientParameters)
                }
            )
            return kernelClient ?? null
        },
        queryKey: getSessionKernelClientQueryKey(
            appId,
            chain,
            validator,
            kernelAddress,
            entryPoint,
            session,
            options
        )
    } as const satisfies QueryOptions<
        GetSessionKernelClientQueryFnData,
        GetSessionKernelClientErrorType,
        GetSessionKernelClientData,
        GetSessionKernelClientQueryKey
    >
}

export type GetSessionKernelClientQueryFnData =
    Evaluate<GetSessionKernelClientReturnType>

export type GetSessionKernelClientData = GetSessionKernelClientQueryFnData

export function getSessionKernelClientQueryKey(
    appId: string | null,
    chain: Chain | null,
    validator: KernelValidator<EntryPoint> | null,
    kernelAddress: Address | undefined,
    entryPoint: EntryPoint | null,
    session: SessionType | null,
    options: GetSessionKernelClientOptions
) {
    return [
        "sessionKernelClient",
        filterQueryOptions(options),
        {
            appId,
            chain,
            validator,
            kernelAddress,
            entryPoint,
            session
        }
    ] as const
}

export type GetSessionKernelClientQueryKey = ReturnType<
    typeof getSessionKernelClientQueryKey
>
