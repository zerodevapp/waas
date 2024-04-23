import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import type { WriteContractParameters } from "@wagmi/core"
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

export type SendUserOperationVariables = WriteContractParameters[]

export type UseSendUserOperationParameters = {
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
    isParallel?: boolean
    nonceKey?: string
}

export type UseSendUserOperationKey = {
    variables: SendUserOperationVariables
    kernelClient: KernelAccountClient<EntryPoint> | undefined | null
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null
    isParallel: boolean
    seed: string
    nonceKey: string | undefined
}

export type SendUserOperationReturnType = Hash

export type UseSendUserOperationReturnType = {
    write: (variables: SendUserOperationVariables) => void
} & Omit<
    UseMutationResult<
        SendUserOperationReturnType,
        unknown,
        UseSendUserOperationKey,
        unknown
    >,
    "mutate"
>

function mutationKey({ ...config }: UseSendUserOperationKey) {
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
            entity: "sendUserOperation",
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
    config: UseSendUserOperationKey
): Promise<SendUserOperationReturnType> {
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

    return kernelClient.sendUserOperation({
        userOperation: {
            callData: await kernelAccount.encodeCallData(
                variables.map((p) => ({
                    to: p.address,
                    value: p.value ?? 0n,
                    data: encodeFunctionData(p)
                }))
            ),
            nonce
        }
    })
}

export function useSendUserOperation(
    parameters: UseSendUserOperationParameters = {}
): UseSendUserOperationReturnType {
    const { isParallel = true, nonceKey } = parameters
    const { kernelAccount, kernelClient, error } = useKernelClient(parameters)

    const seed = useMemo(() => generateRandomString(), [])

    const { mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            kernelClient,
            kernelAccount,
            variables: {} as SendUserOperationVariables,
            isParallel: isParallel,
            seed,
            nonceKey
        }),
        mutationFn
    })

    const write = useMemo(() => {
        return (variables: SendUserOperationVariables) => {
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
