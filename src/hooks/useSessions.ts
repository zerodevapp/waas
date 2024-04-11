import { useContext, useMemo } from "react";
import { SessionContext } from "../providers/SessionContext";
import { type SessionType } from "../types";
import { useKernelClient } from "./useKernelClient";

export type useSessionsReturnType = SessionType | null;

export function useSessions(): useSessionsReturnType {
  const { address } = useKernelClient();
  const { sessions } = useContext(SessionContext);

  const accountSession = useMemo(() => {
    if (!sessions) return null;
    return Object.entries(sessions)
      .filter(([key, session]) => session.smartAccount === address)
      .reduce((acc: SessionType, [key, session]) => {
        acc[key as `0x${string}`] = session;
        return acc;
      }, {});
  }, [sessions, address]);


  return accountSession;
}
