import { BaseError } from "@wagmi/core"

export type PermissionsEmptyErrorType = PermissionsEmptyError & {
    name: "PermissionsInvalidErrorType"
}

export class PermissionsEmptyError extends BaseError {
    override name = "PermissionsEmptyError"
    constructor() {
        super("Permission can not be empty.")
    }
}

export type PoliciesEmptyErrorType = PoliciesEmptyError & {
    name: "PoliciesEmptyErrorType"
}

export class PoliciesEmptyError extends BaseError {
    override name = "PoliciesEmptyError"
    constructor() {
        super("Policies can not be empty.")
    }
}
