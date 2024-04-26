import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useConfig } from "wagmi"
import type { CreateKernelClientEOAErrorType } from "../actions/createKernelClientEOA"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type CreateKernelClientEOAData,
    type CreateKernelClientEOAMutate,
    type CreateKernelClientEOAMutateAsync,
    type CreateKernelClientEOAVariables,
    createKernelClientEOAMutationOptions
} from "../query/createKernelClientEOA"
import type { KernelVersionType } from "../types"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"

export type UseCreateKernelClientEOAParameters<context = unknown> = Evaluate<
    {
        mutation?:
            | UseMutationParameters<
                  CreateKernelClientEOAData,
                  CreateKernelClientEOAErrorType,
                  CreateKernelClientEOAVariables,
                  context
              >
            | undefined
    } & {
        version: KernelVersionType
    }
>

export type UseCreateKernelClientEOAReturnType<context = unknown> = Evaluate<
    UseMutationReturnType<
        CreateKernelClientEOAData,
        CreateKernelClientEOAErrorType,
        CreateKernelClientEOAVariables,
        context
    > & {
        connect: CreateKernelClientEOAMutate<context>
        connectAsync: CreateKernelClientEOAMutateAsync<context>
    }
>

export function useCreateKernelClientEOA<context = unknown>(
    parameters: UseCreateKernelClientEOAParameters<context> = { version: "v3" }
): UseCreateKernelClientEOAReturnType<context> {
    const { mutation, version } = parameters
    const config = useConfig()
    const { client } = useZeroDevConfig()

    const {
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient
    } = useSetKernelAccount()

    const mutationOptions = createKernelClientEOAMutationOptions(
        config,
        client,
        version
    )
    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions,
        onSuccess: (data, variables, context) => {
            setValidator(data.validator)
            setKernelAccount(data.kernelAccount)
            setEntryPoint(data.entryPoint)
            setKernelAccountClient(null)
            mutation?.onSuccess?.(data, variables, context)
        }
    })

    return {
        ...result,
        connect: mutate,
        connectAsync: mutateAsync
    }
}
