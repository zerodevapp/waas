import { connect, getAccount, getWalletClient, switchChain } from "@wagmi/core"
import type { Evaluate } from "@wagmi/core/internal"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import { walletClientToSmartAccountSigner } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import { http, createPublicClient } from "viem"
import type {
    ResourceUnavailableRpcErrorType,
    UserRejectedRequestErrorType
} from "viem"
import type { Config, Connector, CreateConnectorFn } from "wagmi"
import type { Config as ZdConfig } from "../createConfig"
import {
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"
import type { KernelVersionType } from "../types"
import { ZERODEV_BUNDLER_URL } from "../utils/constants"
import { getEntryPointFromVersion } from "../utils/entryPoint"

export type CreateKernelClientEOAParameters = Evaluate<{
    connector: Connector | CreateConnectorFn
}>

export type CreateKernelClientEOAReturnType = {
    validator: KernelValidator<EntryPoint>
    kernelAccount: KernelSmartAccount<EntryPoint>
    entryPoint: EntryPoint
}

export type CreateKernelClientEOAErrorType =
    | ZerodevNotConfiguredErrorType
    | ResourceUnavailableRpcErrorType
    | UserRejectedRequestErrorType

export async function createKernelClientEOA(
    wagmiConfig: Config,
    zdConfig: ZdConfig,
    version: KernelVersionType,
    parameters: CreateKernelClientEOAParameters
) {
    const { connector } = parameters

    const chainId = zdConfig.state.chainId
    const chain = zdConfig.chains.find((x) => x.id === chainId)
    if (!chain) throw new ZerodevNotConfiguredError()

    const client = zdConfig.getClient({ chainId })

    const entryPoint = getEntryPointFromVersion(version)

    const { status } = getAccount(wagmiConfig)

    const isConnected =
        "uid" in connector && connector.uid === wagmiConfig.state.current

    if (status === "disconnected" && !isConnected) {
        await connect(wagmiConfig, { connector, chainId: chainId })
    } else {
        if (wagmiConfig.state.chainId !== chainId) {
            await switchChain(wagmiConfig, { chainId })
        }
    }
    const walletClient = await getWalletClient(wagmiConfig)

    const ecdsaValidator = await signerToEcdsaValidator(client, {
        entryPoint: entryPoint,
        signer: walletClientToSmartAccountSigner(walletClient)
    })
    const account = await createKernelAccount(client, {
        entryPoint: entryPoint,
        plugins: {
            sudo: ecdsaValidator
        }
    })
    const uid = `ecdsa:${account.address}`

    zdConfig.setState((x) => {
        const chainId = x.chainId
        return {
            ...x,
            connections: new Map(x.connections).set(uid, {
                chainId,
                accounts: [
                    {
                        client: null,
                        account: account,
                        entryPoint,
                        validator: ecdsaValidator
                    }
                ]
            }),
            current: uid
        }
    })

    return { validator: ecdsaValidator, kernelAccount: account, entryPoint }
}
