import type { MutationOptions } from "@tanstack/query-core"
import type { PublicClient } from "viem"
import type { Config } from "wagmi"
import {
    type CreateKernelClientEOAErrorType,
    type CreateKernelClientEOAParameters,
    type CreateKernelClientEOAReturnType,
    createKernelClientEOA
} from "../actions/createKernelClientEOA"
import type { KernelVersionType } from "../types"
import type { Mutate, MutateAsync } from "../types/query"

export type CreateKernelClientEOAVariables = CreateKernelClientEOAParameters

export type CreateKernelClientEOAData = CreateKernelClientEOAReturnType

export type CreateKernelClientEOAMutate<context = unknown> = Mutate<
    CreateKernelClientEOAData,
    CreateKernelClientEOAErrorType,
    CreateKernelClientEOAVariables,
    context
>

export type CreateKernelClientEOAMutateAsync<context = unknown> = MutateAsync<
    CreateKernelClientEOAData,
    CreateKernelClientEOAErrorType,
    CreateKernelClientEOAVariables,
    context
>

export function createKernelClientEOAMutationOptions(
    config: Config,
    publicClient: PublicClient | null,
    version: KernelVersionType
) {
    return {
        mutationFn(variables) {
            return createKernelClientEOA(
                config,
                publicClient,
                version,
                variables
            )
        },
        mutationKey: ["createKernelClientEOA"]
    } as const satisfies MutationOptions<
        CreateKernelClientEOAData,
        CreateKernelClientEOAErrorType,
        CreateKernelClientEOAVariables
    >
}
