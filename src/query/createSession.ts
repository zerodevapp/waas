import type { MutationOptions } from "@tanstack/query-core"
import type { KernelValidator } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { PublicClient } from "viem"
import {
    type CreateSessionErrorType,
    type CreateSessionParameters,
    type CreateSessionReturnType,
    createSession
} from "../actions/createSession"
import type { Mutate, MutateAsync } from "../types/query"

export type CreateSessionVariables = CreateSessionParameters

export type CreateSessionData = CreateSessionReturnType

export type CreateSessionMutate<context = unknown> = Mutate<
    CreateSessionData,
    CreateSessionErrorType,
    CreateSessionVariables,
    context
>

export type CreateSessionMutateAsync<context = unknown> = MutateAsync<
    CreateSessionData,
    CreateSessionErrorType,
    CreateSessionVariables,
    context
>

export function createSessionMutationOptions<TEntryPoint extends EntryPoint>(
    entryPoint: TEntryPoint | null,
    validator: KernelValidator<TEntryPoint> | null,
    publicClient: PublicClient | null
) {
    return {
        mutationFn(variables) {
            return createSession(entryPoint, validator, publicClient, variables)
        },
        mutationKey: ["createSession"]
    } as const satisfies MutationOptions<
        CreateSessionData,
        CreateSessionErrorType,
        CreateSessionVariables
    >
}
