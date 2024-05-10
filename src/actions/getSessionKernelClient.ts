import {
    ERC20PaymasterTokenNotSupportedError,
    type ERC20PaymasterTokenNotSupportedErrorType,
    type KernelClientNotConnectedErrorType,
    SessionIdMissingError,
    type SessionIdMissingErrorType,
    SessionNotAvailableError,
    SessionNotFoundError,
    type SessionNotFoundErrorType,
    ZerodevNotConfiguredError,
    type ZerodevNotConfiguredErrorType
} from "../errors"

import {
    type KernelAccountClient,
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccountClient,
    createZeroDevPaymasterClient,
    gasTokenAddresses
} from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { http, type Address, type Chain, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { Config } from "../createConfig"
import type {
    GasTokenChainIdType,
    GasTokenType,
    PaymasterERC20,
    PaymasterSPONSOR,
    SessionType
} from "../types"
import { ZERODEV_BUNDLER_URL, ZERODEV_PAYMASTER_URL } from "../utils/constants"
import { getSessionKernelAccount } from "../utils/sessions/"

export type GetSessionKernelClientParameters = {
    sessionId?: `0x${string}` | null | undefined
    paymaster?: PaymasterERC20 | PaymasterSPONSOR
}

export type GetSessionKernelClientReturnType = {
    kernelClient: KernelAccountClient<EntryPoint> | undefined
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined
}

export type GetSessionKernelClientErrorType =
    | KernelClientNotConnectedErrorType
    | SessionNotFoundErrorType
    | SessionIdMissingErrorType
    | ERC20PaymasterTokenNotSupportedErrorType
    | ZerodevNotConfiguredErrorType

export async function getSessionKernelClient(
    config: Config,
    validator: KernelValidator<EntryPoint>,
    kernelAddress: Address,
    entryPoint: EntryPoint,
    session: SessionType | null,
    parameters: GetSessionKernelClientParameters
): Promise<GetSessionKernelClientReturnType> {
    const { sessionId, paymaster } = parameters

    const chainId = config.state.chainId
    const selectedChain = config.chains.find((x) => x.id === chainId)
    if (!selectedChain) {
        throw new ZerodevNotConfiguredError()
    }
    const projectId = config.projectIds[selectedChain.id]
    if (!session) {
        throw new SessionNotFoundError()
    }
    const accountSession = Object.values(session).filter(
        (s) => s.smartAccount === kernelAddress
    )
    if (accountSession.length === 0) {
        throw new SessionNotAvailableError(kernelAddress)
    }
    if (accountSession.length > 1 && !sessionId) {
        throw new SessionIdMissingError()
    }
    const selectedSession = sessionId ? session[sessionId] : accountSession[0]

    const sessionSigner = privateKeyToAccount(selectedSession.sessionKey)
    const client = config.getClient({ chainId })
    const { kernelAccount } = await getSessionKernelAccount({
        sessionSigner,
        publicClient: client,
        sudoValidator: validator,
        entryPoint: entryPoint,
        policies: selectedSession.policies,
        permissions: selectedSession.permissions,
        enableSignature: selectedSession.enableSignature
    })

    const kernelClient = createKernelAccountClient({
        account: kernelAccount,
        chain: selectedChain,
        bundlerTransport: http(`${ZERODEV_BUNDLER_URL}/${projectId}`),
        entryPoint: entryPoint,
        middleware: !paymaster
            ? undefined
            : {
                  sponsorUserOperation: async ({ userOperation }) => {
                      let gasToken: GasTokenType | undefined
                      if (paymaster.type === "ERC20") {
                          const chainId =
                              selectedChain.id as GasTokenChainIdType
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
                          chain: selectedChain,
                          transport: http(
                              `${ZERODEV_PAYMASTER_URL}/${projectId}?paymasterProvider=PIMLICO`
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
        kernelAccount
    }
}
