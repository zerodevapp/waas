import type { Evaluate } from "@wagmi/core/internal"
import type { GetBalanceErrorType } from "../actions/getBalance"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import {
    type GetBalanceData,
    type GetBalanceOptions,
    type GetBalanceQueryFnData,
    type GetBalanceQueryKey,
    getBalanceQueryOption
} from "../query/getBalance"
import {
    type QueryParameter,
    type UseQueryReturnType,
    useQuery
} from "../types/query"
import { useKernelClient } from "./useKernelClient"

export type UseBalanceParameters<selectData = GetBalanceData> = Evaluate<
    GetBalanceOptions &
        QueryParameter<
            GetBalanceQueryFnData,
            GetBalanceErrorType,
            selectData,
            GetBalanceQueryKey
        >
>

export type UseBalanceReturnType<selectData = GetBalanceData> =
    UseQueryReturnType<selectData, GetBalanceErrorType>

export function useBalance<selectData = GetBalanceData>(
    parameters: UseBalanceParameters<selectData> = {}
): UseBalanceReturnType<selectData> {
    const { address, query = {} } = parameters
    const { address: kernelAddress } = useKernelClient()
    const { client } = useZeroDevConfig()

    const accountAddress = address ?? kernelAddress

    const options = getBalanceQueryOption(client, {
        ...parameters,
        address: accountAddress
    })
    const enabled = Boolean(accountAddress && (query.enabled ?? true))

    return useQuery({ ...query, ...options, enabled })
}
