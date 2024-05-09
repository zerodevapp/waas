import type { Policy } from "@zerodev/permissions"
import {
    type ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react"
import { createSession, getAllSession } from "../utils/sessions/manageSession"

import type { Permission } from "@zerodev/session-key"
import type { Abi } from "viem"
import type { SessionType } from "../types"

type UpdateSessionArgs = {
    sessionId: `0x${string}`
    chainId: number
    smartAccount: `0x${string}`
    enableSignature: `0x${string}`
    sessionKey: `0x${string}`
    policies: Policy[]
    permissions: Permission<Abi>[]
}

interface SessionContextValue {
    sessions: SessionType | null
    updateSession: (args: UpdateSessionArgs) => void
}

interface SessionProviderProps {
    children: ReactNode
}

export const SessionContext = createContext<SessionContextValue>({
    sessions: {},
    updateSession: () => {}
})

export function SessionProvider({ children }: SessionProviderProps) {
    const [sessions, setSessions] = useState<SessionType>({})

    useEffect(() => {
        const allSession = getAllSession()
        setSessions(allSession || {})
    }, [])

    function updateSession({
        sessionId,
        chainId,
        smartAccount,
        enableSignature,
        policies,
        sessionKey,
        permissions
    }: UpdateSessionArgs) {
        const chainSessionID =
            `${sessionId}:${chainId.toString()}` as `0x${string}`
        createSession(
            chainSessionID,
            smartAccount,
            enableSignature,
            policies,
            permissions,
            sessionKey
        )
        setSessions((prev) => ({
            ...prev,
            [chainSessionID]: {
                smartAccount,
                enableSignature,
                policies,
                sessionKey,
                permissions
            }
        }))
    }

    return (
        <SessionContext.Provider
            value={useMemo(
                () => ({
                    sessions,
                    updateSession: updateSession
                }),
                [sessions, updateSession]
            )}
        >
            {children}
        </SessionContext.Provider>
    )
}

export function useUpdateSession() {
    const { updateSession } = useContext(SessionContext)

    return { updateSession }
}
