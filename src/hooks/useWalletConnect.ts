import { useContext, useEffect } from "react";
import type { Web3WalletTypes } from '@walletconnect/web3wallet'
import type { SessionTypes } from '@walletconnect/types'
import { WCLoadingState, WalletConnectContext } from "../providers/WalletConnectContext";

export type WalletConnectReturnType = {
  connect: (uri: string) => void
  approveSessionProposal: (proposalData?: Web3WalletTypes.SessionProposal) => void
  rejectSessionProposal: () => void
  disconnect: (session: SessionTypes.Struct) => void
  approveSessionRequest: () => void
  rejectSessionRequest: () => void
  sessionRequest: Web3WalletTypes.SessionRequest | undefined
  sessionProposal: Web3WalletTypes.SessionProposal | undefined
  isLoading: WCLoadingState | undefined
  sessions: SessionTypes.Struct[]
  error: Error | undefined
}

export function useWalletConnect(): WalletConnectReturnType {
  const {
    hasBeenInitialized,
    setHasBeenInitialized,
    sessions,
    sessionProposal,
    sessionRequest,
    error,
    isLoading,
    connect,
    approveSessionRequest,
    rejectSessionRequest,
    approveSessionProposal,
    rejectSessionProposal,
    disconnect,
  } = useContext(WalletConnectContext)

  useEffect(() => {
    if (!hasBeenInitialized) {
      setHasBeenInitialized(true);
    }
  }, [hasBeenInitialized]);

  return {
    connect,
    approveSessionProposal,
    rejectSessionProposal,
    disconnect,
    approveSessionRequest,
    rejectSessionRequest,
    sessionProposal,
    sessionRequest,
    isLoading,
    sessions,
    error,
  }
}

