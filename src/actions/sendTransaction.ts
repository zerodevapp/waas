import type { SendTransactionParameters as viem_sendTransactionParameters } from "@wagmi/core"
import {
    type KernelAccountClient,
    getCustomNonceKeyFromString
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Hash } from "viem"
import {
    KernelClientNotConnectedError,
    type KernelClientNotConnectedErrorType
} from "../errors"
import { generateRandomString } from "../utils"

export type SendTransactionParameters = viem_sendTransactionParameters[]

export type SendTransactionReturnType = Hash

export type SendTransactionErrorType = KernelClientNotConnectedErrorType

export async function sendTransaction<TEntryPoint extends EntryPoint>(
    kernelClient: KernelAccountClient<TEntryPoint> | undefined | null,
    isParallel: boolean,
    nonceKey: string | undefined,
    parameters: SendTransactionParameters
): Promise<SendTransactionReturnType> {
    if (!kernelClient || !kernelClient.account) {
        throw new KernelClientNotConnectedError()
    }
    const kernelAccount = kernelClient.account
    let nonce: bigint | undefined
    if (nonceKey || isParallel) {
        const seedForNonce = nonceKey ? nonceKey : generateRandomString()
        const customNonceKey = getCustomNonceKeyFromString(
            seedForNonce,
            kernelAccount.entryPoint
        )
        nonce = await kernelAccount.getNonce(customNonceKey)
    }

    const txHash = await kernelClient.sendTransactions({
        transactions: parameters.map((p) => ({
            ...p,
            data: p.data ?? "0x",
            value: p.value ?? 0n
        })),
        nonce
    })

    return txHash
}
