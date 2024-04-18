import { createContext, type Dispatch, type SetStateAction} from 'react'
import type { Web3WalletTypes } from '@walletconnect/web3wallet'
import type { SessionTypes } from '@walletconnect/types'

export enum WCLoadingState {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  CONNECT = 'Connect',
  DISCONNECT = 'Disconnect',
}

type WalletConnectContextType = {
  hasBeenInitialized: boolean
  setHasBeenInitialized: Dispatch<SetStateAction<boolean>>
  error: Error | undefined
  isLoading: WCLoadingState | undefined
  sessions: SessionTypes.Struct[]
  sessionProposal: Web3WalletTypes.SessionProposal | undefined
  sessionRequest: Web3WalletTypes.SessionRequest | undefined
  connect: (uri: string) => Promise<void>
  approveSessionRequest: () => Promise<void>
  rejectSessionRequest: () => Promise<void>
  approveSessionProposal: (proposalData?: Web3WalletTypes.SessionProposal) => Promise<void>
  rejectSessionProposal: () => Promise<void>
  disconnect: (session: SessionTypes.Struct) => Promise<void>
}

export const WalletConnectContext = createContext<WalletConnectContextType>({
  hasBeenInitialized: false,
  setHasBeenInitialized: () => {},
  error: undefined,
  isLoading: undefined,
  sessions: [],
  sessionProposal: undefined,
  sessionRequest: undefined,
  connect: () => Promise.resolve(),
  approveSessionRequest: () => Promise.resolve(),
  rejectSessionRequest: () => Promise.resolve(),
  approveSessionProposal: () => Promise.resolve(),
  rejectSessionProposal: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
})

