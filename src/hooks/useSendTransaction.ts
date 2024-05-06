import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import type { SendTransactionParameters } from "@wagmi/core"
import {
    type KernelAccountClient,
    type KernelSmartAccount,
    getCustomNonceKeyFromString
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { useMemo } from "react"
import { type Hash, encodeFunctionData } from "viem"
import type { PaymasterERC20, PaymasterSPONSOR } from "../types"
import { generateRandomString } from "../utils"
import { useKernelClient } from "./useKernelClient"

export type SendTransactionVariables = SendTransactionParameters[]

export type UseSendTransactionParameters = {
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
    isParallel?: boolean
    nonceKey?: string
}

export type UseSendTransactionKey = {
    variables: SendTransactionVariables
    kernelClient: KernelAccountClient<EntryPoint> | undefined | null
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null
    isParallel: boolean
    seed: string
    nonceKey: string | undefined
}

export type SendTransactionReturnType = Hash

export type UseSendTransactionReturnType = {
    write: (variables: SendTransactionVariables) => void
} & Omit<
    UseMutationResult<
        SendTransactionReturnType,
        unknown,
        UseSendTransactionKey,
        unknown
    >,
    "mutate"
>

function mutationKey({ ...config }: UseSendTransactionKey) {
    const {
        kernelAccount,
        kernelClient,
        variables,
        isParallel,
        seed,
        nonceKey
    } = config

    return [
        {
            entity: "sendTransaction",
            kernelAccount,
            kernelClient,
            variables,
            isParallel,
            seed,
            nonceKey
        }
    ] as const
}

async function mutationFn(
    config: UseSendTransactionKey
): Promise<SendTransactionReturnType> {
    const {
        kernelAccount,
        kernelClient,
        variables,
        isParallel,
        seed,
        nonceKey
    } = config

    if (!kernelClient || !kernelAccount) {
        throw new Error("Kernel Client is required")
    }

    const seedForNonce = nonceKey ? nonceKey : seed
    let nonce: bigint | undefined
    if (nonceKey || isParallel) {
        const customNonceKey = getCustomNonceKeyFromString(
            seedForNonce,
            kernelAccount.entryPoint
        )
        nonce = await kernelAccount.getNonce(customNonceKey)
    }

    return kernelClient.sendTransactions({
        transactions: variables.map((p) => ({
            to: p.to,
            value: p.value ?? 0n,
            data: p.data ?? "0x"
        })),
        nonce
    })
}

export function useSendTransaction(
    parameters: UseSendTransactionParameters = {}
): UseSendTransactionReturnType {
    const { isParallel = true, nonceKey } = parameters
    const { kernelAccount, kernelClient, error } = useKernelClient(parameters)

    const seed = useMemo(() => generateRandomString(), [])

    const { mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            kernelClient,
            kernelAccount,
            variables: {} as SendTransactionVariables,
            isParallel: isParallel,
            seed,
            nonceKey
        }),
        mutationFn
    })

    const write = useMemo(() => {
        return (variables: SendTransactionVariables) => {
            mutate({
                variables,
                kernelAccount,
                kernelClient,
                isParallel: isParallel,
                seed: generateRandomString(),
                nonceKey
            })
        }
    }, [mutate, kernelClient, kernelAccount, isParallel, nonceKey])

    return {
        ...result,
        error: error ?? result.error,
        write
    }
}
