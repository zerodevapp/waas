import { BaseError } from "@wagmi/core"

export type KernelClientInvalidErrorType = KernelClientInvalidError & {
    name: "KernelClientInvalidErrorType"
}

export class KernelClientInvalidError extends BaseError {
    override name = "KernelClientInvalidErrorType"
    constructor() {
        super("KernelClient is invalid.")
    }
}

export type KernelClientNotSupportedErrorType =
    KernelClientNotSupportedError & {
        name: "KernelClientNotSupportedError"
    }

export class KernelClientNotSupportedError extends BaseError {
    override name = "KernelClientNotSupportedError"
    constructor(action: string, version: string) {
        super(`KernelClient: ${action} is not supported in ${version}.`)
    }
}

export type KernelClientNotConnectedErrorType =
    KernelClientNotConnectedError & {
        name: "KernelClientNotConnectedErrorType"
    }

export class KernelClientNotConnectedError extends BaseError {
    override name = "KernelClientNotConnectedError"
    constructor() {
        super("KernelClient not connected.")
    }
}
