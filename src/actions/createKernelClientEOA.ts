import { connect, getAccount, getWalletClient } from "@wagmi/core"
import type { Evaluate } from "@wagmi/core/internal"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import { walletClientToSmartAccountSigner } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import type { PublicClient } from "viem"
import type {
    ResourceUnavailableRpcErrorType,
    UserRejectedRequestErrorType
} from "viem"
import type { Config, Connector, CreateConnectorFn } from "wagmi"
import {
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"
import type { KernelVersionType } from "../types"
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
    publicClient: PublicClient | null,
    version: KernelVersionType,
    parameters: CreateKernelClientEOAParameters
) {
    const { connector } = parameters

    if (!publicClient) throw new ZerodevNotConfiguredError()

    const entryPoint = getEntryPointFromVersion(version)

    const { status } = getAccount(wagmiConfig)

    const isConnected =
        "uid" in connector && connector.uid === wagmiConfig.state.current

    if (status === "disconnected" && !isConnected) {
        await connect(wagmiConfig, { connector })
    }
    const walletClient = await getWalletClient(wagmiConfig)

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint: entryPoint,
        signer: walletClientToSmartAccountSigner(walletClient)
    })
    const account = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        plugins: {
            sudo: ecdsaValidator
        }
    })
    return { validator: ecdsaValidator, kernelAccount: account, entryPoint }
}
