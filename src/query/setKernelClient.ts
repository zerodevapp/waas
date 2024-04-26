import type { MutationOptions } from "@tanstack/query-core"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    type SetKernelClientErrorType,
    type SetKernelClientParameters,
    type SetKernelClientReturnType,
    setKernelClient
} from "../actions/setKernelClient"
import type { Mutate, MutateAsync } from "../types/query"

export type SetKernelClientVariables = SetKernelClientParameters

export type SetKernelClientData = SetKernelClientReturnType

export type SetKernelClientMutate<context = unknown> = Mutate<
    SetKernelClientData,
    SetKernelClientErrorType,
    SetKernelClientVariables,
    context
>

export type SetKernelClientMutateAsync<context = unknown> = MutateAsync<
    SetKernelClientData,
    SetKernelClientErrorType,
    SetKernelClientVariables,
    context
>

export function setKernelClientMutationOptions(
    setKernelAccountClient: (
        kernelAccountClient: KernelAccountClient<EntryPoint>
    ) => void
) {
    return {
        mutationFn(variables) {
            return setKernelClient(setKernelAccountClient, variables)
        },
        mutationKey: ["setKernelClient"]
    } as const satisfies MutationOptions<
        SetKernelClientData,
        SetKernelClientErrorType,
        SetKernelClientVariables
    >
}
