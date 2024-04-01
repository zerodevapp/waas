import { useEffect, useState, useCallback, useMemo } from "react";
import type { Web3WalletTypes } from '@walletconnect/web3wallet'
import { getSdkError } from '@walletconnect/utils'
import { hexToUtf8 } from '@walletconnect/encoding'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import type { SessionTypes } from '@walletconnect/types'
import WalletConnectWallet from '../walletconnect/WalletConnectWallet'
import { KernelAccountClient, KernelEIP1193Provider } from "@zerodev/sdk";
import { stripEip155Prefix } from "../walletconnect/constants";

type WalletConnectHook = {
  connect: (uri: string) => void
  onApprove: (proposalData?: Web3WalletTypes.SessionProposal) => void
  proposal: Web3WalletTypes.SessionProposal | undefined
  onReject: () => void
  isLoading: boolean
  disconnect: (session: SessionTypes.Struct) => void
  sessions: SessionTypes.Struct[]
}

// todo
export enum WCLoadingState {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  CONNECT = 'Connect',
  DISCONNECT = 'Disconnect',
}

type Props = {
  kernelClient: KernelAccountClient
}

export default function useWalletConnect({ kernelClient }: Props): WalletConnectHook {
  const [wcWallet, setWcWallet] = useState<WalletConnectWallet>()
  const [proposal, setProposal] = useState<Web3WalletTypes.SessionProposal>()
  const [isLoading, setIsLoading] = useState(false)
  const [kernelProvider, setKernelProvider] = useState<KernelEIP1193Provider>()
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([])
  const chainId = useMemo(() => kernelClient?.chain?.id, [kernelClient])
  const address = useMemo(() => kernelClient?.account?.address, [kernelClient])

  useEffect(() => {
    const getWallet = async () => {
      const wcWallet = new WalletConnectWallet()
      await wcWallet.init()
      setWcWallet(wcWallet)
    }
    getWallet()
  }, [])

  useEffect(() => {
    if (!kernelClient) return
    const provider = new KernelEIP1193Provider(kernelClient)
    setKernelProvider(provider)
  }, [kernelClient])

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
    }, [kernelProvider])

  // Subscribe to requests
  useEffect(() => {
    if (!wcWallet || !kernelProvider || !chainId) return

    return wcWallet.onRequest(async (event) => {
      console.log(event)

      const { topic } = event
      const session = wcWallet.getActiveSessions().find((s) => s.topic === topic)
      const requestChainId = stripEip155Prefix(event.params.chainId)

      const getResponse = () => {
        console.log(event)

        // Get error if wrong chain
        if (!session || parseInt(requestChainId) !== parseInt(chainId)) {
          if (session) {
            // setError(getWrongChainError(getPeerName(session.peer))) // TODO
          }

          const error = getSdkError('UNSUPPORTED_CHAINS')
          return formatJsonRpcError(event.id, error)
        }

        console.log('session_request: ', event);
        console.log('session: ', session);
        return handleKernelRequest(event)
      }

      try {
        const response = await getResponse()

        // Send response to WalletConnect
        await wcWallet.sendSessionResponse(topic, response)
      } catch (e) {
        console.log(e)
        return formatJsonRpcError(event.id, {
          code: 5000,
          message: (e as Error)?.message,
        })
        // setError(asError(e))
      }
    })
  }, [wcWallet, chainId, kernelProvider, handleKernelRequest])

  // Update chainId/safeAddress
  useEffect(() => {
    if (!wcWallet || !chainId || !address) return

    wcWallet.updateSessions(chainId, address).catch((e: Error) => {
      console.log(e)
    })
  }, [wcWallet, chainId, address])

  const connect = async (uri: string) => {
    if (!wcWallet) return
    await wcWallet.connect(uri)
  }

  const onApprove = useCallback(
    async (proposalData?: Web3WalletTypes.SessionProposal) => {
      const sessionProposal = proposalData || proposal

      if (!wcWallet || !chainId || !address || !sessionProposal) return

      const label = sessionProposal?.params.proposer.metadata.url
      console.log('label', label);

      setIsLoading(true)

      try {
        const response = await wcWallet.approveSession(sessionProposal, chainId, address)
        console.log('response', response)
      } catch (e) {
        setIsLoading(false)
        console.log(e)
        // setError(asError(e))
        return
      }

      setIsLoading(false)
      setProposal(undefined)
    },
    [proposal, wcWallet, chainId, address, setIsLoading],
  )

  // Subscribe to session proposals
  useEffect(() => {
    if (!wcWallet) return
    return wcWallet.onSessionPropose((proposalData) => {
      // setError(null)

      setProposal(proposalData)
    })
  }, [wcWallet, onApprove, chainId])

  // On session reject
  const onReject = useCallback(async () => {
    if (!wcWallet || !proposal) return

    const label = proposal?.params.proposer.metadata.url
    console.log('reject label', label);

    setIsLoading(true)

    try {
      await wcWallet.rejectSession(proposal)
    } catch (e) {
      setIsLoading(false)
      console.log(e)
      // setError(asError(e))
    }

    setIsLoading(false)
    setProposal(undefined)
  }, [wcWallet, proposal, setIsLoading, setProposal])

  const disconnect = async (session: SessionTypes.Struct) => {
    if (!wcWallet) return
    await wcWallet.disconnectSession(session)
  }

  const updateSessions = useCallback(() => {
    if (!wcWallet) return
    setSessions(wcWallet.getActiveSessions())
  }, [wcWallet])

  // Initial sessions
  useEffect(updateSessions, [updateSessions])

  // On session add
  useEffect(() => {
    if (!wcWallet) return
    return wcWallet.onSessionAdd(updateSessions)
  }, [wcWallet, updateSessions])

  // On session delete
  useEffect(() => {
    if (!wcWallet) return
    return wcWallet.onSessionDelete(updateSessions)
  }, [wcWallet, updateSessions])

  return {
    connect,
    onApprove,
    proposal,
    onReject,
    isLoading,
    disconnect,
    sessions,
  }
}

