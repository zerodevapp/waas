import { useMutation } from "@tanstack/react-query"
import type { Evaluate } from "@wagmi/core/internal"
import { useMemo } from "react"
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
import { generateRandomString } from "../utils"
import { useChainId } from "./useChainId"
import { useKernelClient } from "./useKernelClient"

export type UseSendUserOperationParameters<context = unknown> = Evaluate<
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
        paymaster?: PaymasterERC20 | PaymasterSPONSOR
        isParallel?: boolean
        nonceKey?: string
    }
>

export type UseSendUserOperationReturnType<context = unknown> = Evaluate<
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

export function useSendUserOperation<context = unknown>(
    parameters: UseSendUserOperationParameters<context> = {}
): UseSendUserOperationReturnType<context> {
    const { isParallel = true, nonceKey, paymaster, mutation } = parameters
    const { kernelClient, isPending } = useKernelClient(parameters)
    const chainId = useChainId()
    const seed = useMemo(() => generateRandomString(), [])

    const mutationOptions = createSendUserOperationOptions(
        "sendUserOperation",
        kernelClient,
        isParallel,
        seed,
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
