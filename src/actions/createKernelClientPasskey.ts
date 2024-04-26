import type { Evaluate } from "@wagmi/core/internal"
import {
    createPasskeyValidator,
    getPasskeyValidator
} from "@zerodev/passkey-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { PublicClient } from "viem"
import {
    PasskeyRegisterNoUsernameError,
    type PasskeyRegisterNoUsernameErrorType,
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"
import type { KernelVersionType } from "../types"
import { ZERODEV_PASSKEY_URL } from "../utils/constants"
import { getEntryPointFromVersion } from "../utils/entryPoint"
import { getWeb3AuthNValidatorFromVersion } from "../utils/webauthn"

export type PasskeConnectType = "register" | "login"

export type CreateKernelClientPasskeyParameters = Evaluate<{
    type: PasskeConnectType
    username?: string | undefined
}>

export type CreateKernelClientPasskeyReturnType = {
    validator: KernelValidator<EntryPoint>
    kernelAccount: KernelSmartAccount<EntryPoint>
    entryPoint: EntryPoint
}

export type CreateKernelClientPasskeyErrorType =
    | ZerodevNotConfiguredErrorType
    | PasskeyRegisterNoUsernameErrorType

export async function createKernelClientPasskey(
    publicClient: PublicClient | null,
    appId: string | null,
    version: KernelVersionType,
    parameters: CreateKernelClientPasskeyParameters
) {
    const { type, username } = parameters

    if (!publicClient || !appId) {
        throw new ZerodevNotConfiguredError()
    }

    let passkeyValidator: KernelValidator<EntryPoint>
    const entryPoint = getEntryPointFromVersion(version)
    const webauthnValidator = getWeb3AuthNValidatorFromVersion(version)

    if (type === "register") {
        if (!username) {
            throw new PasskeyRegisterNoUsernameError()
        }
        passkeyValidator = await createPasskeyValidator(publicClient, {
            passkeyName: username,
            passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${appId}`,
            entryPoint: entryPoint,
            validatorAddress: webauthnValidator
        })
    } else {
        passkeyValidator = await getPasskeyValidator(publicClient, {
            passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${appId}`,
            entryPoint: entryPoint,
            validatorAddress: webauthnValidator
        })
    }

    const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        plugins: {
            sudo: passkeyValidator
        }
    })

    return { validator: passkeyValidator, kernelAccount, entryPoint }
}
