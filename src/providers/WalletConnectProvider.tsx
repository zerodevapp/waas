import { useCallback, useState, useEffect, useMemo } from 'react'
import { KernelEIP1193Provider } from "@zerodev/sdk";
import type { Web3WalletTypes } from '@walletconnect/web3wallet'
import type { SessionTypes } from '@walletconnect/types'
import { hexToUtf8 } from '@walletconnect/encoding'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { EntryPoint } from "permissionless/types";
import { useKernelClient } from "../hooks/useKernelClient";
import WalletConnectWallet from '../utils/walletconnect/WalletConnectWallet'
import { stripEip155Prefix } from "../utils/walletconnect/constants";
import { asError, getWrongChainError, getPeerName } from "../utils/walletconnect/utils";
import { WCLoadingState, WalletConnectContext } from './WalletConnectContext';

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  // Only initialize WalletConnect if the useWalletConnect() hook is called
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);

  const [wcWallet, setWcWallet] = useState<WalletConnectWallet | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [isLoading, setIsLoading] = useState<WCLoadingState | undefined>()
  const [kernelProvider, setKernelProvider] = useState<KernelEIP1193Provider<EntryPoint>>()
  const { kernelClient } = useKernelClient()
  const [sessionProposal, setSessionProposal] = useState<Web3WalletTypes.SessionProposal>()
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([])
  const [sessionRequest, setSessionRequest] = useState<Web3WalletTypes.SessionRequest>()
  const chainId = useMemo(() => kernelClient?.chain?.id, [kernelClient])
  const address = useMemo(() => kernelClient?.account?.address, [kernelClient])

  useEffect(() => {
    if (!hasBeenInitialized) return
    const getWallet = async () => {
      const wcWallet = new WalletConnectWallet()
      await wcWallet.init()
      setWcWallet(wcWallet)
    }
    getWallet()
  }, [hasBeenInitialized])

  useEffect(() => {
    if (!kernelClient || !hasBeenInitialized) return
    const provider = new KernelEIP1193Provider(kernelClient)
    setKernelProvider(provider)
  }, [kernelClient, chainId, hasBeenInitialized])

  // Subscribe to requests
  useEffect(() => {
    if (!wcWallet || !kernelProvider || !chainId || !hasBeenInitialized) return

    return wcWallet.onRequest(async (event) => {
      setSessionRequest(event);
    })
  }, [wcWallet, chainId, kernelProvider, hasBeenInitialized])

  // Update chainId/address
  useEffect(() => {
    if (!wcWallet || !chainId || !address || !hasBeenInitialized) return

    wcWallet.updateSessions(chainId.toString(), address).catch((e: Error) => {
      setError(asError(e))
    })
  }, [wcWallet, chainId, address, hasBeenInitialized])

  // Subscribe to session proposals
  useEffect(() => {
    if (!wcWallet || !hasBeenInitialized) return
    return wcWallet.onSessionPropose((proposalData) => {
      setError(undefined)

      setSessionProposal(proposalData)
    })
  }, [wcWallet, chainId, hasBeenInitialized])

  // Initial sessions
  useEffect(() => {
    if (!hasBeenInitialized) return
    updateSessions()
  }, [hasBeenInitialized])

  // On session add
  useEffect(() => {
    if (!wcWallet || !hasBeenInitialized) return
    return wcWallet.onSessionAdd(updateSessions)
  }, [wcWallet, hasBeenInitialized])

  // On session delete
  useEffect(() => {
    if (!wcWallet || !hasBeenInitialized) return
    return wcWallet.onSessionDelete(updateSessions)
  }, [wcWallet, hasBeenInitialized])
  

  const handleKernelRequest = useCallback(
    async (event: Web3WalletTypes.SessionRequest): Promise<{
      jsonrpc: string
      id: number
      result: unknown
    }> => {
      if (!kernelProvider) throw new Error('Kernel provider not initialized')

      const { params, id } = event
      const { request } = params
      if (request.method === 'personal_sign') {
        const requestParamsMessage = request.params[0]

        const message = hexToUtf8(requestParamsMessage)
        const signedMessage = await kernelProvider.request({
          ...request,
          params: [
            message,
            request.params[1]
          ]
        })

        return { id, result: signedMessage, jsonrpc: '2.0' }
      }

      if (request.method === 'eth_sign') {
        const requestParamsMessage = request.params[1]

        const message = hexToUtf8(requestParamsMessage)
        const signedMessage = await kernelProvider.request({
          ...request,
          params: [
            request.params[0],
            message,
          ]
        })

        return { id, result: signedMessage, jsonrpc: '2.0' }
      }

      const result = await kernelProvider.request(request)
      return {
        jsonrpc: '2.0',
        id: id,
        result
      }
    },
    [kernelProvider, chainId]
  )

  const approveSessionRequest = useCallback(async () => {
    const event = sessionRequest
    if (!event || !wcWallet) return

    const { topic } = event
    const session = wcWallet.getActiveSessions().find((s) => s.topic === topic)
    const requestChainId = stripEip155Prefix(event.params.chainId)

    const getResponse = () => {
      // Get error if wrong chain
      if (!session || parseInt(requestChainId) !== chainId) {
        if (session) {
          setError(getWrongChainError(getPeerName(session.peer)))
        }

        const error = getSdkError('UNSUPPORTED_CHAINS')
        return formatJsonRpcError(event.id, error)
      }
      setSessionRequest(undefined)
      return handleKernelRequest(event)
    }

    try {
      const response = await getResponse()

      // Send response to WalletConnect
      await wcWallet.sendSessionResponse(topic, response)
    } catch (e) {
      setError(asError(e))
      const errorResponse = formatJsonRpcError(event.id, {
        code: 5000,
        message: (e as Error)?.message,
      })
      await wcWallet.sendSessionResponse(topic, errorResponse)
    } finally {
      setSessionRequest(undefined)
    }
  }, [sessionRequest, handleKernelRequest, wcWallet, chainId])

  const rejectSessionRequest = useCallback(async () => {
    if (!wcWallet || !sessionRequest) return

    const { topic } = sessionRequest
    const errorResponse = formatJsonRpcError(sessionRequest.id, {
      code: 5000,
      message: 'User Rejected',
    })
    await wcWallet.sendSessionResponse(topic, errorResponse)
    setSessionRequest(undefined)
  }, [wcWallet, sessionRequest, chainId])

  const connect = useCallback(
    async (uri: string) => {
      if (!wcWallet) return

      if (uri && !uri.startsWith('wc:')) {
        setError(new Error('Invalid pairing code'))
        return
      }

      setError(undefined)

      setIsLoading(WCLoadingState.CONNECT)
      try {
        await wcWallet.connect(uri)
      } catch (e) {
        setError(asError(e))
      }
      setIsLoading(undefined)
    },
    [wcWallet, setIsLoading]
  )

  const approveSessionProposal = useCallback(
    async (proposalData?: Web3WalletTypes.SessionProposal) => {
      const proposal = proposalData || sessionProposal

      if (!wcWallet || !chainId || !address || !proposal) return

      setIsLoading(WCLoadingState.APPROVE)

      try {
        await wcWallet.approveSession(proposal, chainId.toString(), address)
      } catch (e) {
        setError(asError(e))
      }

      setIsLoading(undefined)
      setSessionProposal(undefined)
    },
    [sessionProposal, wcWallet, chainId, address, setIsLoading],
  )

  // On session reject
  const rejectSessionProposal = useCallback(async () => {
    if (!wcWallet || !sessionProposal) return

    setIsLoading(WCLoadingState.REJECT)

    try {
      await wcWallet.rejectSession(sessionProposal)
    } catch (e) {
      setError(asError(e))
    }

    setIsLoading(undefined)
    setSessionProposal(undefined)
  }, [wcWallet, sessionProposal, setIsLoading, setSessionProposal])

  const disconnect = async (session: SessionTypes.Struct) => {
    if (!wcWallet) return

    setIsLoading(WCLoadingState.DISCONNECT)

    try {
      await wcWallet.disconnectSession(session)
    } catch (e) {
      setError(asError(e))
    }

    setIsLoading(undefined)
  }

  const updateSessions = useCallback(() => {
    if (!wcWallet) return
    setSessions(wcWallet.getActiveSessions())
  }, [wcWallet])
  
  return (
    <WalletConnectContext.Provider value={{
      hasBeenInitialized,
      setHasBeenInitialized,
      error,
      isLoading,
      sessions,
      sessionProposal,
      sessionRequest,
      connect,
      approveSessionRequest,
      rejectSessionRequest,
      approveSessionProposal,
      rejectSessionProposal,
      disconnect,
    }}>
      {children}
    </WalletConnectContext.Provider>
  )
}
