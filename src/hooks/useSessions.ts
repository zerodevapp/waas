import { useContext, useMemo } from "react"
import { SessionContext } from "../providers/SessionContext"
import type { SessionType } from "../types"
import { useChainId } from "./useChainId"
import { useKernelClient } from "./useKernelClient"

export type useSessionsReturnType = SessionType | null

export function useSessions(): useSessionsReturnType {
    const chainId = useChainId()
    const { address } = useKernelClient()
    const { sessions } = useContext(SessionContext)

    const accountSession = useMemo(() => {
        if (!sessions) return null
        return Object.entries(sessions)
            .filter(
                ([key, session]) =>
                    session.smartAccount === address &&
                    key.endsWith(`:${chainId}`)
            )
            .reduce((acc: SessionType, [key, session]) => {
                const sessionId = key.split(":")[0] as `0x${string}`
                acc[sessionId] = session
                return acc
            }, {})
    }, [sessions, address, chainId])

    return accountSession
}
