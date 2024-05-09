import type { Evaluate } from "@wagmi/core/internal"
import type { KernelValidator } from "@zerodev/sdk"
import type { Permission } from "@zerodev/session-key"
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import { http, type Abi, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { Config } from "../createConfig"
import {
    KernelClientNotConnectedError,
    type KernelClientNotConnectedErrorType,
    KernelClientNotSupportedError,
    type KernelClientNotSupportedErrorType,
    PermissionsEmptyError,
    type PermissionsEmptyErrorType,
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"
import { ZERODEV_BUNDLER_URL } from "../utils/constants"
import { createSessionKernelAccount, createSessionKey } from "../utils/sessions"

export type CreateBasicSessionParameters = Evaluate<{
    permissions: Permission<Abi>[]
}>

export type CreateBasicSessionReturnType = Evaluate<{
    chainId: number
    sessionKey: `0x${string}`
    sessionId: `0x${string}`
    smartAccount: `0x${string}`
    enableSignature: `0x${string}`
    permissions: Permission<Abi>[]
}>

export type CreateBasicSessionErrorType =
    | ZerodevNotConfiguredErrorType
    | KernelClientNotSupportedErrorType
    | PermissionsEmptyErrorType
    | KernelClientNotConnectedErrorType

export async function createBasicSession<TEntryPoint extends EntryPoint>(
    entryPoint: TEntryPoint | null,
    validator: KernelValidator<TEntryPoint> | null,
    config: Config,
    parameters: CreateBasicSessionParameters
): Promise<CreateBasicSessionReturnType> {
    const { permissions } = parameters

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

    if (entryPoint !== ENTRYPOINT_ADDRESS_V06) {
        throw new KernelClientNotSupportedError("create basicSession", "v3")
    }
    if (!permissions || permissions.length === 0)
        throw new PermissionsEmptyError()

    const sessionKey = createSessionKey()
    const sessionSigner = privateKeyToAccount(sessionKey)

    const kernelAccount = await createSessionKernelAccount({
        sessionSigner,
        publicClient: publicClient,
        sudoValidator: validator,
        entryPoint: entryPoint,
        permissions: permissions
    })
    return {
        chainId,
        sessionKey: sessionKey,
        sessionId: kernelAccount.sessionId,
        smartAccount: kernelAccount.smartAccount,
        enableSignature: kernelAccount.enableSignature,
        permissions: kernelAccount.permissions
    }
}
