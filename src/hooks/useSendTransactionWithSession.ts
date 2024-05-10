import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import type { SendTransactionErrorType } from "../actions/sendTransaction"
import {
    type SendTransactionData,
    type SendTransactionMutate,
    type SendTransactionMutateAsync,
    type SendTransactionVariables,
    createSendTransactionOptions
} from "../query/sendTransaction"
import type { PaymasterERC20, PaymasterSPONSOR } from "../types"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"
import { useChainId } from "./useChainId"
import { useSessionKernelClient } from "./useSessionKernelClient"

export type UseSendTransactionWithSessionParameters<context = unknown> =
    Evaluate<
        {
            mutation?:
                | UseMutationParameters<
                      SendTransactionData,
                      SendTransactionErrorType,
                      SendTransactionVariables,
                      context
                  >
                | undefined
        } & {
            sessionId?: `0x${string}` | null | undefined
            paymaster?: PaymasterERC20 | PaymasterSPONSOR
            isParallel?: boolean
            nonceKey?: string
        }
    >

export type UseSendTransactionWithSessionReturnType<context = unknown> =
    Evaluate<
        UseMutationReturnType<
            SendTransactionData,
            SendTransactionErrorType,
            SendTransactionVariables,
            context
        > & {
            isLoading: boolean
            write: SendTransactionMutate<context>
            writeAsync: SendTransactionMutateAsync<context>
        }
    >

export function useSendTransactionWithSession<context = unknown>(
    parameters: UseSendTransactionWithSessionParameters<context> = {}
): UseSendTransactionWithSessionReturnType<context> {
    const {
        isParallel = true,
        nonceKey,
        mutation,
        sessionId,
        paymaster
    } = parameters
    const { kernelClient, isPending } = useSessionKernelClient(parameters)
    const chainId = useChainId()

    const mutationOptions = createSendTransactionOptions(
        "sendTransactionWithSession",
        kernelClient,
        isParallel,
        nonceKey,
        chainId,
        paymaster,
        sessionId
    )

    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions
    })

    return {
        ...result,
        isLoading: isPending,
        write: mutate,
        writeAsync: mutateAsync
    }
}
