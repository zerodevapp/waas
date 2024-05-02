import {
    type KernelAccountClient,
    type KernelSmartAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
    gasTokenAddresses
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { http, type Address, type Chain, type Transport } from "viem"
import {
    ERC20PaymasterTokenNotSupportedError,
    type ERC20PaymasterTokenNotSupportedErrorType,
    type KernelClientNotConnectedErrorType
} from "../errors"
import type {
    GasTokenChainIdType,
    GasTokenType,
    PaymasterERC20,
    PaymasterSPONSOR
} from "../types"
import { ZERODEV_BUNDLER_URL, ZERODEV_PAYMASTER_URL } from "../utils/constants"

export type GetKernelClientParameters = {
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
}

export type GetKernelClientReturnType = {
    address: Address | undefined
    entryPoint: EntryPoint | undefined
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined
    kernelClient: KernelAccountClient<EntryPoint> | undefined
    isConnected: boolean
}

export type GetKernelClientErrorType =
    | KernelClientNotConnectedErrorType
    | ERC20PaymasterTokenNotSupportedErrorType

export async function getKernelClient(
    appId: string,
    chain: Chain,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    parameters: GetKernelClientParameters
): Promise<GetKernelClientReturnType> {
    const { paymaster } = parameters

    if (kernelAccountClient?.account) {
        return {
            kernelClient: kernelAccountClient,
            kernelAccount: kernelAccountClient.account,
            address: kernelAccountClient.account.address,
            entryPoint: kernelAccountClient.account.entryPoint,
            isConnected: true
        }
    }

    if (!appId || !chain || !kernelAccount || !entryPoint) {
        return {
            kernelClient: undefined,
            kernelAccount: undefined,
            address: undefined,
            entryPoint: undefined,
            isConnected: false
        }
    }
    const kernelClient = createKernelAccountClient({
        account: kernelAccount,
        chain: chain,
        bundlerTransport: http(`${ZERODEV_BUNDLER_URL}/${appId}`),
        entryPoint: entryPoint,
        middleware: !paymaster
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
                              throw new ERC20PaymasterTokenNotSupportedError(
                                  paymaster.gasToken,
                                  chainId
                              )
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
    })

    return {
        kernelClient,
        kernelAccount: kernelClient.account,
        address: kernelClient.account.address,
        entryPoint: entryPoint,
        isConnected: true
    }
}
