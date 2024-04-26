import type { BaseError } from "@wagmi/core"

export type DisconnectKernelClientParameters = unknown

export type DisconnectKernelClientReturnType = void

export type DisconnectKernelClientErrorType = typeof BaseError

export async function disconnectKernelClient(
    disconnectKernelClient: () => void,
    logoutSocial: () => Promise<void>
): Promise<DisconnectKernelClientReturnType> {
    await logoutSocial()
    disconnectKernelClient()
    return
}
