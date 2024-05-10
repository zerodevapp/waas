import type { MutationOptions } from "@tanstack/query-core"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    type SendTransactionErrorType,
    type SendTransactionParameters,
    type SendTransactionReturnType,
    sendTransaction
} from "../actions/sendTransaction"
import type { PaymasterERC20, PaymasterSPONSOR } from "../types"
import type { Mutate, MutateAsync } from "../types/query"

export type SendTransactionVariables = SendTransactionParameters

export type SendTransactionData = SendTransactionReturnType

export type SendTransactionMutate<context = unknown> = Mutate<
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionVariables,
    context
>

export type SendTransactionMutateAsync<context = unknown> = MutateAsync<
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionVariables,
    context
>

export type SendTransactionType =
    | "sendTransaction"
    | "sendTransactionWithSession"

export function createSendTransactionOptions<TEntryPoint extends EntryPoint>(
    type: SendTransactionType,
    kernelClient: KernelAccountClient<TEntryPoint> | undefined | null,
    isParallel: boolean,
    nonceKey: string | undefined,
    chainId: number | null,
    paymaster?: PaymasterERC20 | PaymasterSPONSOR,
    sessionId?: `0x${string}` | null | undefined
) {
    return {
        mutationFn(variables) {
            return sendTransaction(
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
        SendTransactionData,
        SendTransactionErrorType,
        SendTransactionVariables
    >
}
