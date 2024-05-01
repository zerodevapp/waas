import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import type { CreateSessionErrorType } from "../actions/createSession"
import { useUpdateSession } from "../providers/SessionContext"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type CreateSessionData,
    type CreateSessionMutate,
    type CreateSessionMutateAsync,
    type CreateSessionVariables,
    createSessionMutationOptions
} from "../query/createSession"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"

export type UseCreateSessionParameters<context = unknown> = Evaluate<{
    mutation?:
        | UseMutationParameters<
              CreateSessionData,
              CreateSessionErrorType,
              CreateSessionVariables,
              context
          >
        | undefined
}>

export type UseCreateSessionReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        CreateSessionData,
        CreateSessionErrorType,
        CreateSessionVariables,
        context
    > & {
        write: CreateSessionMutate<context>
        writeAsync: CreateSessionMutateAsync<context>
    }
>

export function useCreateSession<context = unknown>(
    parameters: UseCreateSessionParameters<context> = {}
): UseCreateSessionReturnType<context> {
    const { mutation } = parameters
    const { validator, entryPoint } = useKernelAccount()
    const { client } = useZeroDevConfig()
    const { updateSession } = useUpdateSession()

    const mutationOptions = createSessionMutationOptions(
        entryPoint,
        validator,
        client
    )

    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
        onSuccess: (data, varialbes, context) => {
            updateSession({
                ...data,
                permissions: []
            })
            mutation?.onSuccess?.(data, varialbes, context)
        }
    })

    return {
        ...result,
        write: mutate,
        writeAsync: mutateAsync
    }
}
