import {
    type QueryFunction,
    type QueryFunctionContext,
    type UseQueryResult,
    useQuery
} from "@tanstack/react-query"
import {
    type KernelAccountClient,
    type KernelSmartAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
    gasTokenAddresses
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    http,
    type Address,
    type Chain,
    type PublicClient,
    type Transport
} from "viem"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import type {
    GasTokenChainIdType,
    GasTokenType,
    PaymasterERC20,
    PaymasterSPONSOR
} from "../types"
import { ZERODEV_BUNDLER_URL, ZERODEV_PAYMASTER_URL } from "../utils/constants"

export type KernelClientKey = [
    key: string,
    params: {
        appId: string | undefined | null
        chain: Chain | null
        kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null
        kernelAccountClient:
            | KernelAccountClient<
                  EntryPoint,
                  Transport,
                  Chain,
                  KernelSmartAccount<EntryPoint>
              >
            | undefined
            | null
        publicClient: PublicClient | undefined | null
        entryPoint: EntryPoint
        parameters: UseKernelClientParameters
    }
]

export type GetKernelClientReturnType = {
    address: Address
    entryPoint: EntryPoint
    kernelAccount: KernelSmartAccount<EntryPoint>
    kernelClient: KernelAccountClient<
        EntryPoint,
        Transport,
        Chain,
        KernelSmartAccount<EntryPoint>
    >
}

export type UseKernelClientParameters = {
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
}

export type UseKernelClientReturnType = {
    address: Address | undefined
    entryPoint: EntryPoint
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined
    kernelClient:
        | KernelAccountClient<
              EntryPoint,
              Transport,
              Chain,
              KernelSmartAccount<EntryPoint>
          >
        | undefined
    isConnected: boolean
    isLoading: boolean
    error: unknown
} & UseQueryResult<GetKernelClientReturnType, unknown>

async function getKernelClient({
    queryKey
}: QueryFunctionContext<KernelClientKey>): Promise<GetKernelClientReturnType> {
    const [
        _key,
        {
            appId,
            publicClient,
            kernelAccount,
            entryPoint,
            chain,
            kernelAccountClient,
            parameters: { paymaster }
        }
    ] = queryKey

    if (kernelAccountClient) {
        return {
            kernelClient: kernelAccountClient,
            kernelAccount: kernelAccountClient.account,
            address: kernelAccountClient.account.address,
            entryPoint: entryPoint
        }
    }

    if (!appId || !chain || !publicClient || !kernelAccount || !entryPoint) {
        throw new Error("missing appId or kernelAccount")
    }

    const kernelClient = createKernelAccountClient({
        account: kernelAccount,
        chain: chain,
        bundlerTransport: http(`${ZERODEV_BUNDLER_URL}/${appId}`),
        entryPoint: entryPoint,
        middleware: !paymaster?.type
            ? undefined
            : {
                  sponsorUserOperation: async ({ userOperation }) => {
                      let gasToken: GasTokenType | undefined
                      if (paymaster.type === "ERC20") {
                          const chainId = chain.id as GasTokenChainIdType
                          if (
                              !(chainId in gasTokenAddresses) ||
                              !(
                                  paymaster.gasToken in
                                  gasTokenAddresses[chainId]
                              )
                          ) {
                              throw new Error("ERC20 token not supported")
                          }
                          gasToken =
                              paymaster.gasToken as keyof (typeof gasTokenAddresses)[typeof chainId]
                      }

                      const kernelPaymaster = createZeroDevPaymasterClient({
                          entryPoint: entryPoint,
                          chain: chain,
                          transport: http(
                              `${ZERODEV_PAYMASTER_URL}/${appId}?paymasterProvider=PIMLICO`
                          )
                      })
                      return kernelPaymaster.sponsorUserOperation({
                          userOperation,
                          entryPoint: entryPoint,
                          gasToken: gasToken
                      })
                  }
              }
    }) as KernelAccountClient<
        EntryPoint,
        Transport,
        Chain,
        KernelSmartAccount<EntryPoint>
    >
    return {
        kernelClient,
        kernelAccount,
        address: kernelAccount.address,
        entryPoint
    }
}

export function useKernelClient(
    parameters: UseKernelClientParameters = {}
): UseKernelClientReturnType {
    const { appId, chain, client } = useZeroDevConfig()
    const { kernelAccount, entryPoint, kernelAccountClient } =
        useKernelAccount()

    const { data, ...result } = useQuery({
        queryKey: [
            "session_kernel_client",
            {
                publicClient: client,
                parameters,
                kernelAccount,
                appId,
                entryPoint,
                chain,
                kernelAccountClient
            }
        ],
        queryFn: getKernelClient as unknown as QueryFunction<any>,
        enabled: !!client && !!appId && !!entryPoint && !!chain
    })

    return {
        ...data,
        isConnected: !!data?.kernelClient,
        ...result
    }
}
