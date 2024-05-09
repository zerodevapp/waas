import {
    type KernelAccountClient,
    type KernelSmartAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
    gasTokenAddresses
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { http, type Address, type Chain, type Transport } from "viem"
import type { Config } from "../createConfig"
import {
    ERC20PaymasterTokenNotSupportedError,
    type ERC20PaymasterTokenNotSupportedErrorType,
    type KernelClientNotConnectedErrorType,
    ZerodevNotConfiguredError
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
    config: Config,
    kernelAccountClient: KernelAccountClient<EntryPoint> | null,
    kernelAccount: KernelSmartAccount<EntryPoint> | null,
    entryPoint: EntryPoint | null,
    parameters: GetKernelClientParameters
): Promise<GetKernelClientReturnType> {
    const { paymaster } = parameters

    const account = kernelAccountClient?.account ?? kernelAccount
    if (!account) {
        return {
            kernelClient: undefined,
            kernelAccount: undefined,
            address: undefined,
            entryPoint: undefined,
            isConnected: false
        }
    }
    // if (!kernelAccount || !entryPoint) {
    //     return {
    //         kernelClient: undefined,
    //         kernelAccount: undefined,
    //         address: undefined,
    //         entryPoint: undefined,
    //         isConnected: false
    //     }
    // }
    const chainId = config.state.chainId
    const selectedChain = config.chains.find((x) => x.id === chainId)
    if (!selectedChain) {
        throw new ZerodevNotConfiguredError()
    }
    const projectId = config.projectIds[selectedChain.id]

    const kernelClient = createKernelAccountClient({
        account: account,
        chain: selectedChain,
        bundlerTransport: http(`${ZERODEV_BUNDLER_URL}/${projectId}`),
        entryPoint: account.entryPoint,
        middleware: !paymaster
            ? undefined
            : {
                  sponsorUserOperation: async ({ userOperation }) => {
                      let gasToken: GasTokenType | undefined
                      if (paymaster.type === "ERC20") {
                          const chainId = config.state
                              .chainId as GasTokenChainIdType
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
                          entryPoint: account.entryPoint,
                          chain: selectedChain,
                          transport: http(
                              `${ZERODEV_PAYMASTER_URL}/${projectId}?paymasterProvider=PIMLICO`
                          )
                      })
                      return kernelPaymaster.sponsorUserOperation({
                          userOperation,
                          entryPoint: account.entryPoint,
                          gasToken: gasToken
                      })
                  }
              }
    })
    console.log("get kernelClient", kernelClient)

    return {
        kernelClient,
        kernelAccount: kernelClient.account,
        address: kernelClient.account.address,
        entryPoint: kernelClient.account.entryPoint,
        isConnected: true
    }
}
