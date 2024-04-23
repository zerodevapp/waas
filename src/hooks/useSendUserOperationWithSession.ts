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
import { useSessionKernelClient } from "./useSessionKernelClient"

export type UseSendUserOperationWithSessionParameters = {
    sessionId?: `0x${string}` | null | undefined
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
    isParallel?: boolean
    nonceKey?: string
}

export type SendUserOperationWithSessionVariables = WriteContractParameters[]

export type UseSendUserOperationWithSessionKey = {
    variables: SendUserOperationWithSessionVariables
    kernelClient: KernelAccountClient<EntryPoint> | undefined
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined
    isParallel: boolean
    seed: string
    nonceKey: string | undefined
}

export type SendUserOperationWithSessionReturnType = Hash

export type UseSendUserOperationWithSessionReturnType = {
    isDisabled: boolean
    write: (variables: SendUserOperationWithSessionVariables) => void
} & Omit<
    UseMutationResult<
        SendUserOperationWithSessionReturnType,
        unknown,
        UseSendUserOperationWithSessionKey,
        unknown
    >,
    "mutate"
>

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
    const {
        variables,
        kernelClient,
        kernelAccount,
        isParallel,
        seed,
        nonceKey
    } = config

    return [
        {
            entity: "sendUserOperationWithSession",
            variables,
            kernelClient,
            kernelAccount,
            isParallel,
            seed,
            nonceKey
        }
    ] as const
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
    const {
        variables,
        kernelClient,
        kernelAccount,
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

    const userOpHash = await kernelClient.sendUserOperation({
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

    return userOpHash
}

export function useSendUserOperationWithSession(
    parameters: UseSendUserOperationWithSessionParameters = {}
): UseSendUserOperationWithSessionReturnType {
    const { isParallel = true, nonceKey } = parameters
    const {
        kernelClient,
        kernelAccount,
        isLoading,
        error: clientError
    } = useSessionKernelClient(parameters)

    const seed = useMemo(() => generateRandomString(), [])

    const { mutate, error, ...result } = useMutation({
        mutationKey: mutationKey({
            variables: {} as SendUserOperationWithSessionVariables,
            kernelClient,
            kernelAccount,
            isParallel: isParallel,
            seed,
            nonceKey
        }),
        mutationFn
    })

    const write = useMemo(() => {
        return (variables: SendUserOperationWithSessionVariables) => {
            mutate({
                variables,
                kernelClient,
                kernelAccount,
                isParallel: isParallel,
                seed: generateRandomString(),
                nonceKey
            })
        }
    }, [mutate, kernelClient, kernelAccount, isParallel, nonceKey])

    return {
        ...result,
        isDisabled: !!clientError,
        isPending: isLoading || result.isPending,
        error: error || clientError,
        write
    }
}
