import { BaseError } from "@wagmi/core"
import { Address } from "viem"

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

export type KernelAlreadyOnTheChainErrorType = KernelAlreadyOnTheChainError & {
    name: "KernelAlreadyOnTheChainErrorType"
}

export class KernelAlreadyOnTheChainError extends BaseError {
    override name = "KernelAlreadyOnTheChainError"
    constructor() {
        super("KernelClient already on the chain.")
    }
}

export type ERC20PaymasterTokenNotSupportedErrorType =
    ERC20PaymasterTokenNotSupportedError & {
        name: "ERC20PaymasterTokenNotSupportedErrorType"
    }

export class ERC20PaymasterTokenNotSupportedError extends BaseError {
    override name = "ERC20PaymasterTokenNotSupportedError"
    constructor(token: string, chain: number) {
        super(`ERC20 ${token} not supported on chain ${chain}.`)
    }
}
