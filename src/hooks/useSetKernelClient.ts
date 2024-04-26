import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useContext } from "react"
import type { SetKernelClientErrorType } from "../actions/setKernelClient"
import { ZeroDevValidatorContext } from "../providers/ZeroDevValidatorContext"
import {
    type SetKernelClientData,
    type SetKernelClientMutate,
    type SetKernelClientMutateAsync,
    type SetKernelClientVariables,
    setKernelClientMutationOptions
} from "../query/setKernelClient"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"

export type UseSetKernelClientParameters<context = unknown> = Evaluate<{
    mutation?:
        | UseMutationParameters<
              SetKernelClientData,
              SetKernelClientErrorType,
              SetKernelClientVariables,
              context
          >
        | undefined
}>

export type UseSetKernelClientReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        SetKernelClientData,
        SetKernelClientErrorType,
        SetKernelClientVariables,
        context
    > & {
        setKernelClient: SetKernelClientMutate<context>
        setKernelClientAsync: SetKernelClientMutateAsync<context>
    }
>

export function useSetKernelClient<context = unknown>(
    parameters: UseSetKernelClientParameters<context> = {}
): UseSetKernelClientReturnType<context> {
    const { mutation } = parameters
    const { setKernelAccountClient } = useContext(ZeroDevValidatorContext)

    const mutationOptions = setKernelClientMutationOptions(
        setKernelAccountClient
    )
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutationOptions,
        ...mutation
    })

    return {
        ...result,
        setKernelClient: mutate,
        setKernelClientAsync: mutateAsync
    }
}
