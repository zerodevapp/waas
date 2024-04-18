import {
  WEBAUTHN_VALIDATOR_ADDRESS_V06,
  WEBAUTHN_VALIDATOR_ADDRESS_V07,
} from "@zerodev/passkey-validator";
import { KernelVersionType } from "../types";

export const getWeb3AuthNValidatorFromVersion = (
  version: KernelVersionType
): `0x${string}` => {
  if (version === "v2") return WEBAUTHN_VALIDATOR_ADDRESS_V06;
  return WEBAUTHN_VALIDATOR_ADDRESS_V07;
};
