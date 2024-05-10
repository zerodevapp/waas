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
import { useKernelClient } from "./useKernelClient"

export type UseSendTransactionParameters<context = unknown> = Evaluate<
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
        paymaster?: PaymasterERC20 | PaymasterSPONSOR
        isParallel?: boolean
        nonceKey?: string
    }
>

export type UseSendTransactionReturnType<context = unknown> = Evaluate<
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

export function useSendTransaction<context = unknown>(
    parameters: UseSendTransactionParameters<context> = {}
): UseSendTransactionReturnType<context> {
    const { isParallel = true, nonceKey, paymaster, mutation } = parameters
    const { kernelClient, isPending } = useKernelClient(parameters)
    const chainId = useChainId()

    const mutationOptions = createSendTransactionOptions(
        "sendTransaction",
        kernelClient,
        isParallel,
        nonceKey,
        chainId,
        paymaster
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
