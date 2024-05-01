import type { QueryOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import type { PublicClient } from "viem"
import {
    type GetBalanceErrorType,
    type GetBalanceParameters,
    type GetBalanceReturnType,
    getBalance
} from "../actions/getBalance"
import type { ScopeKeyParameter } from "../types"
import { filterQueryOptions } from "./utils"

export type GetBalanceOptions = Evaluate<
    Partial<GetBalanceParameters> & ScopeKeyParameter
>

export function getBalanceQueryOption(
    publicClient: PublicClient | null,
    options: GetBalanceOptions
) {
    return {
        async queryFn({ queryKey }) {
            const { address, scopeKey: _, ...parameters } = queryKey[1]
            if (!address) throw new Error("Address is required")
            if (!publicClient) throw new Error("Public client is required")

            const balance = await getBalance(publicClient, {
                ...(parameters as GetBalanceParameters),
                address
            })
            return balance ?? null
        },
        queryKey: getBalanceQueryKey(options)
    } as const satisfies QueryOptions<
        GetBalanceQueryFnData,
        GetBalanceErrorType,
        GetBalanceData,
        GetBalanceQueryKey
    >
}

export type GetBalanceQueryFnData = Evaluate<GetBalanceReturnType>

export type GetBalanceData = GetBalanceQueryFnData

export function getBalanceQueryKey(options: GetBalanceOptions) {
    return ["balance", filterQueryOptions(options)] as const
}

export type GetBalanceQueryKey = ReturnType<typeof getBalanceQueryKey>
