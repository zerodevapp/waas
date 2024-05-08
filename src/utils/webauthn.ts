import {
    WEBAUTHN_VALIDATOR_ADDRESS_V06,
    WEBAUTHN_VALIDATOR_ADDRESS_V07
} from "@zerodev/passkey-validator"
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless"
import type { EntryPoint } from "permissionless/types"

export const getWeb3AuthNValidatorFromVersion = (
    entryPoint: EntryPoint
): `0x${string}` => {
    if (entryPoint === ENTRYPOINT_ADDRESS_V06)
        return WEBAUTHN_VALIDATOR_ADDRESS_V06
    return WEBAUTHN_VALIDATOR_ADDRESS_V07
}
