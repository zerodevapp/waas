import type { Evaluate } from "@wagmi/core/internal"
import type { GetKernelClientErrorType } from "../actions/getKernelClient"
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
import { useChainId } from "./useChainId"
import { useConfig } from "./useConfig"

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
    const config = useConfig()
    const chainId = useChainId()
    const { kernelAccount, entryPoint, kernelAccountClient } =
        useKernelAccount()

    const options = getKernelClientQueryOption(
        config,
        kernelAccount,
        kernelAccountClient,
        entryPoint,
        chainId,
        {
            ...parameters
        }
    )
    const enabled = Boolean(kernelAccount)

    return useQueryData({ ...query, ...options, enabled })
}
