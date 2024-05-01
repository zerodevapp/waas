import type { MutationOptions } from "@tanstack/query-core"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    type SendUserOperationErrorType,
    type SendUserOperationParameters,
    type SendUserOperationReturnType,
    sendUserOperation
} from "../actions/sendUserOperation"
import type { Mutate, MutateAsync } from "../types/query"

export type SendUserOperationVariables = SendUserOperationParameters

export type SendUserOperationData = SendUserOperationReturnType

export type SendUserOperationMutate<context = unknown> = Mutate<
    SendUserOperationData,
    SendUserOperationErrorType,
    SendUserOperationVariables,
    context
>

export type SendUserOperationMutateAsync<context = unknown> = MutateAsync<
    SendUserOperationData,
    SendUserOperationErrorType,
    SendUserOperationVariables,
    context
>

export function createSendUserOperationOptions<TEntryPoint extends EntryPoint>(
    kernelClient: KernelAccountClient<TEntryPoint> | undefined,
    isParallel: boolean,
    seed: string,
    nonceKey: string | undefined,
    sessionId?: `0x${string}` | null | undefined
) {
    return {
        mutationFn(variables) {
            return sendUserOperation(
                kernelClient,
                isParallel,
                seed,
                nonceKey,
                variables
            )
        },
        mutationKey: [
            "sendUserOperation",
            [isParallel, seed, nonceKey, sessionId]
        ]
    } as const satisfies MutationOptions<
        SendUserOperationData,
        SendUserOperationErrorType,
        SendUserOperationVariables
    >
}
