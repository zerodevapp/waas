import type { Evaluate } from "@wagmi/core/internal"
import {
    WebAuthnMode,
    toPasskeyValidator,
    toWebAuthnKey
} from "@zerodev/passkey-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import type { Config } from "../createConfig"
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
    config: Config,
    version: KernelVersionType,
    parameters: CreateKernelClientPasskeyParameters
): Promise<CreateKernelClientPasskeyReturnType> {
    const { type, username } = parameters

    const chainId = config.state.chainId
    const chain = config.chains.find((x) => x.id === chainId)
    if (!chain) throw new ZerodevNotConfiguredError()
    const projectId = config.projectIds[chainId]
    const client = config.getClient({ chainId })

    let webAuthnKey: any
    const entryPoint = getEntryPointFromVersion(version)
    const webauthnValidator = getWeb3AuthNValidatorFromVersion(entryPoint)

    if (type === "register") {
        if (!username) {
            throw new PasskeyRegisterNoUsernameError()
        }
        webAuthnKey = await toWebAuthnKey({
            passkeyName: username,
            passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${projectId}`,
            mode: WebAuthnMode.Register
        })
    } else {
        webAuthnKey = await toWebAuthnKey({
            passkeyName: "",
            passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${projectId}`,
            mode: WebAuthnMode.Login
        })
    }
    const passkeyValidator = await toPasskeyValidator(client, {
        webAuthnKey,
        passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${projectId}`,
        entryPoint,
        validatorAddress: webauthnValidator
    })

    const kernelAccount = await createKernelAccount(client, {
        entryPoint: entryPoint,
        plugins: {
            sudo: passkeyValidator
        }
    })
    const uid = `passkey:${kernelAccount.address}`

    config.setState((x) => {
        const chainId = x.chainId
        return {
            ...x,
            connections: new Map(x.connections).set(uid, {
                chainId,
                accounts: [
                    {
                        client: null,
                        account: kernelAccount,
                        entryPoint,
                        validator: passkeyValidator
                    }
                ]
            }),
            current: uid
        }
    })

    return { validator: passkeyValidator, kernelAccount, entryPoint }
}
