import { BaseError } from "@wagmi/core"

export type PasskeyRegisterNoUsernameErrorType =
    PasskeyRegisterNoUsernameError & {
        name: "PasskeyRegisterNoUsernameError"
    }

export class PasskeyRegisterNoUsernameError extends BaseError {
    override name = "PasskeyRegisterNoUsernameError"
    constructor() {
        super("Username is required to register passkey.")
    }
}
