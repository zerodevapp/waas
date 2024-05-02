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

export type SessionNotFoundErrorType = SessionNotFoundError & {
    name: "SessionNotFoundErrorType"
}

export class SessionNotFoundError extends BaseError {
    override name = "SessionNotFoundError"
    constructor() {
        super("Session not found.")
    }
}

export type SessionNotAvailableErrorType = SessionNotAvailableError & {
    name: "SessionNotAvailableErrorType"
}

export class SessionNotAvailableError extends BaseError {
    override name = "SessionNotAvailableError"
    constructor(account: `0x${string}`) {
        super(`No available session for ${account}.`)
    }
}

export type SessionIdMissingErrorType = SessionIdMissingError & {
    name: "SessionIdMissingErrorType"
}

export class SessionIdMissingError extends BaseError {
    override name = "SessionIdMissingError"
    constructor() {
        super("Session id is required.")
    }
}
