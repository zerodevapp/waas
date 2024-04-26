import {
    type DisconnectKernelClientErrorType,
    type DisconnectKernelClientParameters,
    type DisconnectKernelClientReturnType,
    disconnectKernelClient
} from "../actions/disconnectKernelClient"
import type { Mutate, MutateAsync } from "../types/query"

export type DisconnectKernelClientVariables = DisconnectKernelClientParameters

export type DisconnectKernelClientData = DisconnectKernelClientReturnType

export type DisconnectKernelClientMutate<context = unknown> = Mutate<
    DisconnectKernelClientData,
    DisconnectKernelClientErrorType,
    DisconnectKernelClientVariables,
    context
>

export type DisconnectKernelClientMutateAsync<context = unknown> = MutateAsync<
    DisconnectKernelClientData,
    DisconnectKernelClientErrorType,
    DisconnectKernelClientVariables,
    context
>

export function disconnectKernelClientMutationOptions(
    disconnectClient: () => void,
    logoutSocial: () => Promise<void>
) {
    return {
        mutationFn() {
            return disconnectKernelClient(disconnectClient, logoutSocial)
        },
        mutationKey: ["disconnectKernelClient"]
    } as const
}
