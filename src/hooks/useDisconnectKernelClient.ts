import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useMemo } from "react"
import type { DisconnectKernelClientErrorType } from "../actions/disconnectKernelClient"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type DisconnectKernelClientData,
    type DisconnectKernelClientMutate,
    type DisconnectKernelClientMutateAsync,
    type DisconnectKernelClientVariables,
    disconnectKernelClientMutationOptions
} from "../query/disconnectKernelClient"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"
import { useDisconnectSocial } from "./useDisconnectSocial"

export type UseDisconnectKernelClientParameters<context = unknown> = Evaluate<{
    mutation?:
        | UseMutationParameters<
              DisconnectKernelClientData,
              DisconnectKernelClientErrorType,
              DisconnectKernelClientVariables,
              context
          >
        | undefined
}>

export type UseDisconnectKernelClientReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        DisconnectKernelClientData,
        DisconnectKernelClientErrorType,
        DisconnectKernelClientVariables,
        context
    > & {
        disconnect: DisconnectKernelClientMutate<context>
        disconnectAsync: DisconnectKernelClientMutateAsync<context>
    }
>

export function useDisconnectKernelClient<context = unknown>(
    parameters: UseDisconnectKernelClientParameters<context> = {}
): UseDisconnectKernelClientReturnType<context> {
    const { mutation } = parameters
    const { disconnectClient } = useSetKernelAccount()
    const { logoutSocial } = useDisconnectSocial()

    const mutationOptions = disconnectKernelClientMutationOptions(
        disconnectClient,
        logoutSocial
    )

    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions
    })

    const disconnect = useMemo(() => {
        return (variables = {}) => mutate(variables)
    }, [mutate])

    const disconnectAsync = useMemo(() => {
        return (variables = {}) => mutateAsync(variables)
    }, [mutateAsync])

    return {
        ...result,
        disconnect: disconnect,
        disconnectAsync: disconnectAsync
    }
}
