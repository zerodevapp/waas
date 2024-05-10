import { BaseError } from "@wagmi/core"

export type SocialNoAuthorizedErrorType = SocialNoAuthorizedError & {
    name: "SocialNoAuthorizedError"
}

export class SocialNoAuthorizedError extends BaseError {
    override name = "SocialNoAuthorizedError"
    constructor() {
        super("Socail login projectId is not authorized.")
    }
}
