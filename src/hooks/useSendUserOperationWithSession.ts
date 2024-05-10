import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import type { SendUserOperationErrorType } from "../actions/sendUserOperation"
import {
    type SendUserOperationData,
    type SendUserOperationMutate,
    type SendUserOperationMutateAsync,
    type SendUserOperationVariables,
    createSendUserOperationOptions
} from "../query/sendUserOperation"
import type { PaymasterERC20, PaymasterSPONSOR } from "../types"
import type {
    UseMutationParameters,
    UseMutationReturnType
} from "../types/query"
import { useChainId } from "./useChainId"
import { useSessionKernelClient } from "./useSessionKernelClient"

export type UseSendUserOperationWithSessionParameters<context = unknown> =
    Evaluate<
        {
            mutation?:
                | UseMutationParameters<
                      SendUserOperationData,
                      SendUserOperationErrorType,
                      SendUserOperationVariables,
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

export type UseSendUserOperationWithSessionReturnType<context = unknown> =
    Evaluate<
        UseMutationReturnType<
            SendUserOperationData,
            SendUserOperationErrorType,
            SendUserOperationVariables,
            context
        > & {
            isLoading: boolean
            write: SendUserOperationMutate<context>
            writeAsync: SendUserOperationMutateAsync<context>
        }
    >

export function useSendUserOperationWithSession<context = unknown>(
    parameters: UseSendUserOperationWithSessionParameters<context> = {}
): UseSendUserOperationWithSessionReturnType<context> {
    const {
        isParallel = true,
        nonceKey,
        mutation,
        sessionId,
        paymaster
    } = parameters
    const { kernelClient, isPending } = useSessionKernelClient(parameters)
    const chainId = useChainId()

    const mutationOptions = createSendUserOperationOptions(
        "sendUserOperationWithSession",
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
