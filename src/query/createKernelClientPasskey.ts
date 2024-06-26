import type { MutationOptions } from "@tanstack/query-core"
import type { Evaluate } from "@wagmi/core/internal"
import {
    type CreateKernelClientPasskeyErrorType,
    type CreateKernelClientPasskeyParameters,
    type CreateKernelClientPasskeyReturnType,
    createKernelClientPasskey
} from "../actions/createKernelClientPasskey"
import type { Config } from "../createConfig"
import type { KernelVersionType } from "../types"
import type { Mutate, MutateAsync } from "../types/query"

export type CreateKernelClientPasskeyVariables =
    CreateKernelClientPasskeyParameters

export type CreateKernelCLientPasskeyRegisterVariables = Omit<
    CreateKernelClientPasskeyVariables,
    "type"
>

export type CreateKernelCLientPasskeyLoginVariables = Evaluate<
    Omit<CreateKernelClientPasskeyVariables, "type" | "username"> | undefined
>

export type CreateKernelClientPasskeyData = CreateKernelClientPasskeyReturnType

export type CreateKernelClientPasskeyRegisterMutate<context = unknown> = Mutate<
    CreateKernelClientPasskeyData,
    CreateKernelClientPasskeyErrorType,
    CreateKernelCLientPasskeyRegisterVariables,
    context
>

export type CreateKernelClientPasskeyRegisterMutateAsync<context = unknown> =
    MutateAsync<
        CreateKernelClientPasskeyData,
        CreateKernelClientPasskeyErrorType,
        CreateKernelCLientPasskeyRegisterVariables,
        context
    >

export type CreateKernelClientPasskeyLoginMutate<context = unknown> = Mutate<
    CreateKernelClientPasskeyData,
    CreateKernelClientPasskeyErrorType,
    CreateKernelCLientPasskeyLoginVariables,
    context
>

export type CreateKernelClientPasskeyLoginMutateAsync<context = unknown> =
    MutateAsync<
        CreateKernelClientPasskeyData,
        CreateKernelClientPasskeyErrorType,
        CreateKernelCLientPasskeyLoginVariables,
        context
    >

export type CreateKernelClientPasskeyMutate<context = unknown> = Mutate<
    CreateKernelClientPasskeyData,
    CreateKernelClientPasskeyErrorType,
    CreateKernelClientPasskeyVariables,
    context
>

export type CreateKernelClientPasskeyMutateAsync<context = unknown> =
    MutateAsync<
        CreateKernelClientPasskeyData,
        CreateKernelClientPasskeyErrorType,
        CreateKernelClientPasskeyVariables,
        context
    >

export function createKernelClientPasskeyOptions(
    config: Config,
    version: KernelVersionType
) {
    return {
        mutationFn(variables) {
            return createKernelClientPasskey(config, version, variables)
        },
        mutationKey: ["createKernelClientPasskey", version]
    } as const satisfies MutationOptions<
        CreateKernelClientPasskeyData,
        CreateKernelClientPasskeyErrorType,
        CreateKernelClientPasskeyVariables
    >
}
