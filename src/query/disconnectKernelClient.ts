import type { Evaluate } from "@wagmi/core/internal"
import {
    type DisconnectKernelClientErrorType,
    type DisconnectKernelClientParameters,
    type DisconnectKernelClientReturnType,
    disconnectKernelClient
} from "../actions/disconnectKernelClient"
import type { Mutate, MutateAsync } from "../types/query"

export type DisconnectKernelClientVariables = Evaluate<
    DisconnectKernelClientParameters | undefined
>

export type DisconnectKernelClientData = DisconnectKernelClientReturnType

export type DisconnectKernelClientMutate<context = unknown> = Mutate<
    DisconnectKernelClientData,
    DisconnectKernelClientErrorType,
    DisconnectKernelClientVariables | undefined,
    context
>

export type DisconnectKernelClientMutateAsync<context = unknown> = MutateAsync<
    DisconnectKernelClientData,
    DisconnectKernelClientErrorType,
    DisconnectKernelClientVariables | undefined,
    context
>

export function disconnectKernelClientMutationOptions(
    disconnectClient: () => void,
    logoutSocial: () => Promise<void>
) {
    return {
        mutationFn(variables = {}) {
            return disconnectKernelClient(disconnectClient, logoutSocial)
        },
        mutationKey: ["disconnectKernelClient"]
    } as const
}
