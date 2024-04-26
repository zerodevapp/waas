import { BaseError } from "@wagmi/core"

export type ZerodevNotConfiguredErrorType = ZerodevNotConfiguredError & {
    name: "ZerodevNotConfiguredError"
}

export class ZerodevNotConfiguredError extends BaseError {
    override name = "ZerodevNotConfiguredError"
    constructor() {
        super("ZeroDev not configured.")
    }
}
