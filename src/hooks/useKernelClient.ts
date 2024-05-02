import type { Evaluate } from "@wagmi/core/internal"
import type { GetKernelClientErrorType } from "../actions/getKernelClient"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type GetKernelClientData,
    type GetKernelClientOptions,
    type GetKernelClientQueryFnData,
    type GetKernelClientQueryKey,
    getKernelClientQueryOption
} from "../query/getKernelClient"
import {
    type QueryParameter,
    type UseQueryDataReturnType,
    useQueryData
} from "../types/query"

export type UseKernelClientParameters<selectData = GetKernelClientData> =
    Evaluate<
        GetKernelClientOptions &
            QueryParameter<
                GetKernelClientQueryFnData,
                GetKernelClientErrorType,
                selectData,
                GetKernelClientQueryKey
            >
    >

export type UseKernelClientReturnType<selectData = GetKernelClientData> =
    Evaluate<UseQueryDataReturnType<selectData, GetKernelClientErrorType>>

export function useKernelClient<selectData = GetKernelClientData>(
    parameters: UseKernelClientParameters<selectData> = {}
): UseKernelClientReturnType<selectData> {
    const { query = {} } = parameters
    const { appId, chain } = useZeroDevConfig()
    const { kernelAccount, entryPoint, kernelAccountClient } =
        useKernelAccount()

    const options = getKernelClientQueryOption(
        appId,
        chain,
        kernelAccount,
        kernelAccountClient,
        entryPoint,
        {
            ...parameters
        }
    )

    return useQueryData({ ...query, ...options })
}
