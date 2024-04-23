import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { connect, getAccount, getWalletClient } from "@wagmi/core"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import { walletClientToSmartAccountSigner } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import { useMemo } from "react"
import type { PublicClient } from "viem"
import {
    type Config,
    type Connector,
    type CreateConnectorFn,
    useConfig,
    usePublicClient
} from "wagmi"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import type { KernelVersionType } from "../types"
import { getEntryPointFromVersion } from "../utils/entryPoint"

export type UseCreateKernelClientEOAParameters = {
    version: KernelVersionType
}

export type CreateKernelClientEOAVariables = {
    connector: Connector | CreateConnectorFn
}

export type UseCreateKernelClientEOAKey = {
    connector: Connector | CreateConnectorFn | null | undefined
    wagmiConfig: Config | undefined | null
    publicClient: PublicClient | undefined | null
    version: KernelVersionType
}

export type CreateKernelClientEOAReturnType = {
    validator: KernelValidator<EntryPoint>
    kernelAccount: KernelSmartAccount<EntryPoint>
    entryPoint: EntryPoint
}

export type UseCreateKernelClientEOAReturnType = {
    connect: ({ connector }: CreateKernelClientEOAVariables) => void
} & Omit<
    UseMutationResult<
        CreateKernelClientEOAReturnType,
        unknown,
        UseCreateKernelClientEOAKey,
        unknown
    >,
    "mutate"
>

function mutationKey({ ...config }: UseCreateKernelClientEOAKey) {
    const { connector, wagmiConfig } = config

    return [
        {
            entity: "CreateKernelClient",
            connector,
            wagmiConfig
        }
    ] as const
}

async function mutationFn(
    config: UseCreateKernelClientEOAKey
): Promise<CreateKernelClientEOAReturnType> {
    const { wagmiConfig, connector, publicClient, version } = config

    if (!wagmiConfig || !connector || !publicClient) {
        throw new Error("missing config and connector")
    }
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

export function useCreateKernelClientEOA({
    version
}: UseCreateKernelClientEOAParameters): UseCreateKernelClientEOAReturnType {
    const {
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient
    } = useSetKernelAccount()
    const config = useConfig()
    const client = usePublicClient()

    const { data, mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            wagmiConfig: config,
            connector: undefined,
            publicClient: client,
            version
        }),
        mutationFn,
        onSuccess: (data) => {
            setValidator(data.validator)
            setKernelAccount(data.kernelAccount)
            setEntryPoint(data.entryPoint)
            setKernelAccountClient(null)
        }
    })

    const connect = useMemo(() => {
        return ({ connector }: CreateKernelClientEOAVariables) =>
            mutate({
                connector,
                wagmiConfig: config,
                publicClient: client,
                version
            })
    }, [config, mutate, client, version])

    return {
        ...result,
        data,
        connect,
        isPending: !client || result.isPending
    }
}
