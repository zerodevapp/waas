import type { Evaluate } from "@wagmi/core/internal"
import type { GetSessionKernelClientErrorType } from "../actions/getSessionKernelClient"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type GetSessionKernelClientData,
    type GetSessionKernelClientOptions,
    type GetSessionKernelClientQueryFnData,
    type GetSessionKernelClientQueryKey,
    getSessionKernelClientQueryOption
} from "../query/getSessionKernelClient"
import {
    type QueryParameter,
    type UseQueryDataReturnType,
    useQueryData
} from "../types/query"
import { useSessions } from "./useSessions"

export type UseSessionKernelClientParameters<
    selectData = GetSessionKernelClientData
> = Evaluate<
    GetSessionKernelClientOptions &
        QueryParameter<
            GetSessionKernelClientQueryFnData,
            GetSessionKernelClientErrorType,
            selectData,
            GetSessionKernelClientQueryKey
        >
>

export type UseSessionKernelClientReturnType<
    selectData = GetSessionKernelClientData
> = Evaluate<
    UseQueryDataReturnType<selectData, GetSessionKernelClientErrorType>
>

export function useSessionKernelClient<selectData = GetSessionKernelClientData>(
    parameters: UseSessionKernelClientParameters<selectData> = {}
): UseSessionKernelClientReturnType<selectData> {
    const { query = {} } = parameters
    const { appId, chain } = useZeroDevConfig()
    const { validator, kernelAccount, entryPoint } = useKernelAccount()
    const session = useSessions()
    const kernelAddress = kernelAccount?.address

    const options = getSessionKernelClientQueryOption(
        appId,
        chain,
        validator,
        kernelAddress,
        entryPoint,
        session,
        {
            ...parameters
        }
    )
    const enabled = Boolean(validator && kernelAddress && entryPoint)

    return useQueryData({ ...query, ...options, enabled })
}
