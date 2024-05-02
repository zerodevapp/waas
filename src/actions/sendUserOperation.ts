import type { WriteContractParameters } from "@wagmi/core"
import {
    type KernelAccountClient,
    getCustomNonceKeyFromString
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { type Hash, encodeFunctionData } from "viem"
import {
    KernelClientNotConnectedError,
    type KernelClientNotConnectedErrorType
} from "../errors"

export type SendUserOperationParameters = WriteContractParameters[]

export type SendUserOperationReturnType = Hash

export type SendUserOperationErrorType = KernelClientNotConnectedErrorType

export async function sendUserOperation<TEntryPoint extends EntryPoint>(
    kernelClient: KernelAccountClient<TEntryPoint> | undefined | null,
    isParallel: boolean,
    seed: string,
    nonceKey: string | undefined,
    parameters: SendUserOperationParameters
): Promise<SendUserOperationReturnType> {
    if (!kernelClient || !kernelClient.account) {
        throw new KernelClientNotConnectedError()
    }
    const kernelAccount = kernelClient.account
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
                parameters.map((p) => ({
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
