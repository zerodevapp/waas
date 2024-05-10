import type { Evaluate } from "@wagmi/core/internal"
import type { GetBalanceErrorType } from "../actions/getBalance"
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
import { useConfig } from "./useConfig"
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
    const config = useConfig()
    const client = config.getClient({ chainId: config.state.chainId })

    const accountAddress = address ?? kernelAddress

    const options = getBalanceQueryOption(client, {
        ...parameters,
        address: accountAddress
    })
    const enabled = Boolean(accountAddress && (query.enabled ?? true))

    return useQuery({ ...query, ...options, enabled })
}
