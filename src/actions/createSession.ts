import type { Evaluate } from "@wagmi/core/internal"
import type { Policy } from "@zerodev/permissions"
import type { KernelValidator } from "@zerodev/sdk"
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import { http, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { Config } from "../createConfig"
import {
    KernelClientNotConnectedError,
    type KernelClientNotConnectedErrorType,
    KernelClientNotSupportedError,
    type KernelClientNotSupportedErrorType,
    PoliciesEmptyError,
    type PoliciesEmptyErrorType,
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"
import { ZERODEV_BUNDLER_URL } from "../utils/constants"
import { createSessionKernelAccount, createSessionKey } from "../utils/sessions"

export type CreateSessionParameters = Evaluate<{
    policies: Policy[]
}>

export type CreateSessionReturnType = Evaluate<{
    sessionKey: `0x${string}`
    sessionId: `0x${string}`
    smartAccount: `0x${string}`
    enableSignature: `0x${string}`
    policies: Policy[]
}>

export type CreateSessionErrorType =
    | ZerodevNotConfiguredErrorType
    | KernelClientNotSupportedErrorType
    | KernelClientNotConnectedErrorType
    | PoliciesEmptyErrorType

export async function createSession<TEntryPoint extends EntryPoint>(
    entryPoint: TEntryPoint | null,
    validator: KernelValidator<TEntryPoint> | null,
    config: Config,
    // publicClient: PublicClient | null,
    parameters: CreateSessionParameters
): Promise<CreateSessionReturnType> {
    const { policies } = parameters

    const chainId = config.state.chainId
    const selectedChain = config.chains.find((x) => x.id === chainId)
    if (!selectedChain) {
        throw new ZerodevNotConfiguredError()
    }
    const projectId = config.projectIds[selectedChain.id]
    const publicClient = createPublicClient({
        chain: selectedChain,
        transport: http(`${ZERODEV_BUNDLER_URL}/${projectId}`)
    })

    if (!entryPoint || !validator) throw new KernelClientNotConnectedError()

    if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
        throw new KernelClientNotSupportedError("create session", "v2")
    }

    if (!policies || policies.length === 0) throw new PoliciesEmptyError()

    const sessionKey = createSessionKey()
    const sessionSigner = privateKeyToAccount(sessionKey)

    const kernelAccount = await createSessionKernelAccount({
        sessionSigner,
        publicClient,
        sudoValidator: validator,
        entryPoint: entryPoint,
        policies: policies
    })

    return {
        sessionKey: sessionKey,
        sessionId: kernelAccount.sessionId,
        smartAccount: kernelAccount.smartAccount,
        enableSignature: kernelAccount.enableSignature,
        policies: kernelAccount.policies
    }
}
