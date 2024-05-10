import type { MutationOptions } from "@tanstack/query-core"
import type { Config } from "wagmi"
import {
    type CreateKernelClientEOAErrorType,
    type CreateKernelClientEOAParameters,
    type CreateKernelClientEOAReturnType,
    createKernelClientEOA
} from "../actions/createKernelClientEOA"
import type { Config as ZdConfig } from "../createConfig"
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
    zdConfig: ZdConfig,
    version: KernelVersionType
) {
    return {
        mutationFn(variables) {
            return createKernelClientEOA(config, zdConfig, version, variables)
        },
        mutationKey: ["createKernelClientEOA", version]
    } as const satisfies MutationOptions<
        CreateKernelClientEOAData,
        CreateKernelClientEOAErrorType,
        CreateKernelClientEOAVariables
    >
}
