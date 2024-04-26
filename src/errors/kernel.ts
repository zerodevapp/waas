import { BaseError } from "@wagmi/core"

export type KernelClientInvalidErrorType = KernelClientInvalidError & {
    name: "KernelClientInvalidErrorType"
}

export class KernelClientInvalidError extends BaseError {
    override name = "KernelClientInvalidError"
    constructor() {
        super("KernelClient is invalid.")
    }
}
