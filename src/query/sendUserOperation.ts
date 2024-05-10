import type { MutationOptions } from "@tanstack/query-core"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    type SendUserOperationErrorType,
    type SendUserOperationParameters,
    type SendUserOperationReturnType,
    sendUserOperation
} from "../actions/sendUserOperation"
import type { PaymasterERC20, PaymasterSPONSOR } from "../types"
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

export type SendUserOpType =
    | "sendUserOperation"
    | "sendUserOperationWithSession"

export function createSendUserOperationOptions<TEntryPoint extends EntryPoint>(
    type: SendUserOpType,
    kernelClient: KernelAccountClient<TEntryPoint> | undefined | null,
    isParallel: boolean,
    nonceKey: string | undefined,
    chainId: number | null,
    paymaster?: PaymasterERC20 | PaymasterSPONSOR,
    sessionId?: `0x${string}` | null | undefined
) {
    return {
        mutationFn(variables) {
            return sendUserOperation(
                kernelClient,
                isParallel,
                nonceKey,
                variables
            )
        },
        mutationKey: [
            type,
            {
                kernelClient,
                isParallel,
                nonceKey,
                sessionId,
                paymaster,
                chainId
            }
        ]
    } as const satisfies MutationOptions<
        SendUserOperationData,
        SendUserOperationErrorType,
        SendUserOperationVariables
    >
}
