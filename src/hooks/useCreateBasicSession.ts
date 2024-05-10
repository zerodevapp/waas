import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import type { CreateBasicSessionErrorType } from "../actions/createBasicSession"
import { useUpdateSession } from "../providers/SessionContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type CreateBasicSessionData,
    type CreateBasicSessionMutate,
    type CreateBasicSessionMutateAsync,
    type CreateBasicSessionVariables,
    createBasicSessionMutationOptions
} from "../query/createBasicSession"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"
import { useConfig } from "./useConfig"

export type UseCreateBasicSessionParameters<context = unknown> = Evaluate<{
    mutation?:
        | UseMutationParameters<
              CreateBasicSessionData,
              CreateBasicSessionErrorType,
              CreateBasicSessionVariables,
              context
          >
        | undefined
}>

export type UseCreateBasicSessionReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        CreateBasicSessionData,
        CreateBasicSessionErrorType,
        CreateBasicSessionVariables,
        context
    > & {
        write: CreateBasicSessionMutate<context>
        writeAsync: CreateBasicSessionMutateAsync<context>
    }
>

export function useCreateBasicSession<context = unknown>(
    parameters: UseCreateBasicSessionParameters<context> = {}
): UseCreateBasicSessionReturnType<context> {
    const { mutation } = parameters
    const { entryPoint, validator } = useKernelAccount()
    const config = useConfig()
    const { updateSession } = useUpdateSession()

    const mutatoinOptions = createBasicSessionMutationOptions(
        entryPoint,
        validator,
        config
    )

    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutatoinOptions,
        onSuccess: (data, variables, context) => {
            updateSession({
                ...data,
                policies: []
            })
            mutation?.onSuccess?.(data, variables, context)
        }
    })

    return {
        ...result,
        write: mutate,
        writeAsync: mutateAsync
    }
}
