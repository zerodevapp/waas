import type { MutationOptions } from "@tanstack/query-core"
import type { KernelValidator } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { PublicClient } from "viem"
import {
    type CreateBasicSessionErrorType,
    type CreateBasicSessionParameters,
    type CreateBasicSessionReturnType,
    createBasicSession
} from "../actions/createBasicSession"
import type { Config } from "../createConfig"
import type { Mutate, MutateAsync } from "../types/query"

export type CreateBasicSessionVariables = CreateBasicSessionParameters

export type CreateBasicSessionData = CreateBasicSessionReturnType

export type CreateBasicSessionMutate<context = unknown> = Mutate<
    CreateBasicSessionData,
    CreateBasicSessionErrorType,
    CreateBasicSessionVariables,
    context
>

export type CreateBasicSessionMutateAsync<context = unknown> = MutateAsync<
    CreateBasicSessionData,
    CreateBasicSessionErrorType,
    CreateBasicSessionVariables,
    context
>

export function createBasicSessionMutationOptions<
    TEntryPoint extends EntryPoint
>(
    entryPoint: TEntryPoint | null,
    validator: KernelValidator<TEntryPoint> | null,
    config: Config
) {
    return {
        mutationFn(variables) {
            return createBasicSession(entryPoint, validator, config, variables)
        },
        mutationKey: ["createBasicSession"]
    } as const satisfies MutationOptions<
        CreateBasicSessionData,
        CreateBasicSessionErrorType,
        CreateBasicSessionVariables
    >
}
