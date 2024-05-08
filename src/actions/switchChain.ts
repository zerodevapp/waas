import { getWalletClient, switchChain as wagmi_switchChain } from "@wagmi/core"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import {
    deserializePasskeyValidator,
    getPasskeyValidator
} from "@zerodev/passkey-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import { walletClientToSmartAccountSigner } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import { http, createPublicClient } from "viem"
import type { Config as WagmiConfig } from "wagmi"
import type { Config as ZdConfig } from "../createConfig"
import {
    KernelAlreadyOnTheChainError,
    KernelClientNotConnectedError,
    ZerodevNotConfiguredError
} from "../errors"
import { ZERODEV_BUNDLER_URL, ZERODEV_PASSKEY_URL } from "../utils/constants"
import { getWeb3AuthNValidatorFromVersion } from "../utils/webauthn"

export type SwitchChainParameters<
    TZdConfig extends ZdConfig = ZdConfig,
    TChainId extends
        TZdConfig["chains"][number]["id"] = TZdConfig["chains"][number]["id"]
> = {
    chainId: TChainId | ZdConfig["chains"][number]["id"]
}

export type SwitchChainReturnType<
    TConfig extends ZdConfig = ZdConfig,
    TChainId extends
        TConfig["chains"][number]["id"] = TConfig["chains"][number]["id"]
> = {
    id: number
    kernelAccount: KernelSmartAccount<EntryPoint> | null
}

export type SwitchChainErrorType =
    | ZerodevNotConfiguredError
    | KernelClientNotConnectedError

export async function switchChain<
    TZdConfig extends ZdConfig,
    TChainId extends TZdConfig["chains"][number]["id"]
>(
    zdConfig: TZdConfig,
    wagmiConfig: WagmiConfig,
    kernelValidator: KernelValidator<EntryPoint> | null,
    parameters: SwitchChainParameters
): Promise<SwitchChainReturnType<TZdConfig, TChainId>> {
    const { chainId } = parameters

    const chain = zdConfig.chains.find((x) => x.id === chainId)
    const uid = zdConfig.state.current

    if (!chain) {
        throw new ZerodevNotConfiguredError()
    }
    if (chainId === zdConfig.state.chainId) {
        throw new KernelAlreadyOnTheChainError()
    }
    if (!uid) {
        throw new KernelClientNotConnectedError()
    }
    const projectId = zdConfig.projectIds[chainId]
    const entryPoint =
        zdConfig.state.connections.get(uid)?.accounts[0].entryPoint
    if (!entryPoint) {
        throw new KernelClientNotConnectedError()
    }
    const client = createPublicClient({
        chain: chain,
        transport: http(`${ZERODEV_BUNDLER_URL}/${projectId}`)
    })

    const type = uid.split(":")[0]
    let kernelAccount: KernelSmartAccount<EntryPoint> | null = null

    if (type === "ecdsa") {
        if (wagmiConfig.state.chainId !== chainId) {
            await wagmi_switchChain(wagmiConfig, { chainId })
        }

        // reconstruct kernel client
        const walletClient = await getWalletClient(wagmiConfig)
        const ecdsaValidator = await signerToEcdsaValidator(client, {
            entryPoint: entryPoint,
            signer: walletClientToSmartAccountSigner(walletClient)
        })
        kernelAccount = await createKernelAccount(client, {
            entryPoint: entryPoint,
            plugins: {
                sudo: ecdsaValidator
            }
        })
    } else if (type === "passkey") {
        // reconstruct kernel client
        let passkeyValidator: KernelValidator<EntryPoint>

        // use serialized data if passkey validator exists
        if (kernelValidator) {
            const serializedData = (
                kernelValidator as KernelValidator<
                    EntryPoint,
                    "WebAuthnValidator"
                > & {
                    getSerializedData: () => string
                }
            ).getSerializedData()

            passkeyValidator = await deserializePasskeyValidator(client, {
                serializedData,
                entryPoint
            })
        } else {
            const webauthnValidator =
                getWeb3AuthNValidatorFromVersion(entryPoint)
            passkeyValidator = await getPasskeyValidator(client, {
                passkeyServerUrl: `${ZERODEV_PASSKEY_URL}/${projectId}`,
                entryPoint: entryPoint,
                validatorAddress: webauthnValidator
            })
        }
        kernelAccount = await createKernelAccount(client, {
            entryPoint: entryPoint,
            plugins: {
                sudo: passkeyValidator
            }
        })
    }

    zdConfig.setState((x) => ({ ...x, chainId }))

    return {
        // chain as SwitchChainReturnType<TZdConfig, TChainId>
        id: chainId,
        kernelAccount
    }
}
