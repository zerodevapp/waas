import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useMemo } from "react"
import type { CreateKernelClientPasskeyErrorType } from "../actions/createKernelClientPasskey"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import {
    type CreateKernelClientPasskeyData,
    type CreateKernelClientPasskeyLoginMutate,
    type CreateKernelClientPasskeyLoginMutateAsync,
    type CreateKernelClientPasskeyRegisterMutate,
    type CreateKernelClientPasskeyRegisterMutateAsync,
    type CreateKernelClientPasskeyVariables,
    createKernelClientPasskeyOptions
} from "../query/createKernelClientPasskey"
import type { KernelVersionType } from "../types"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"

export type UseCreateKernelClientPasskeyParameters<context = unknown> =
    Evaluate<
        {
            mutation?:
                | UseMutationParameters<
                      CreateKernelClientPasskeyData,
                      CreateKernelClientPasskeyErrorType,
                      CreateKernelClientPasskeyVariables,
                      context
                  >
                | undefined
        } & {
            version: KernelVersionType
        }
    >

export type UseCreateKernelClientPasskeyReturnType<context = unknown> =
    Evaluate<
        UseMutationReturnType<
            CreateKernelClientPasskeyData,
            CreateKernelClientPasskeyErrorType,
            CreateKernelClientPasskeyVariables,
            context
        > & {
            connectRegister: CreateKernelClientPasskeyRegisterMutate<context>
            connectRegisterAsync: CreateKernelClientPasskeyRegisterMutateAsync<context>
            connectLogin: CreateKernelClientPasskeyLoginMutate<context>
            connectLoginAsync: CreateKernelClientPasskeyLoginMutateAsync<context>
        }
    >

export function useCreateKernelClientPasskey<context = unknown>(
    parameters: UseCreateKernelClientPasskeyParameters<context> = {
        version: "v3"
    }
): UseCreateKernelClientPasskeyReturnType<context> {
    const { mutation, version } = parameters
    const { client, appId } = useZeroDevConfig()
    const {
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient
    } = useSetKernelAccount()

    const mutationOptions = createKernelClientPasskeyOptions(
        client,
        appId,
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

    const connectRegister = useMemo(() => {
        return ({ username }: { username?: string | undefined }) =>
            mutate({
                username,
                type: "register"
            })
    }, [mutate])

    const connectRegisterAsync = useMemo(() => {
        return ({ username }: { username?: string | undefined }) =>
            mutateAsync({
                username,
                type: "register"
            })
    }, [mutateAsync])

    const connectLogin = useMemo(() => {
        return () =>
            mutate({
                type: "login"
            })
    }, [mutate])

    const connectLoginAsync = useMemo(() => {
        return () =>
            mutateAsync({
                type: "login"
            })
    }, [mutateAsync])

    return {
        ...result,
        connectRegister: connectRegister,
        connectRegisterAsync: connectRegisterAsync,
        connectLogin: connectLogin,
        connectLoginAsync: connectLoginAsync
    }
}
