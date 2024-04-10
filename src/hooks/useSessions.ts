import { useContext } from "react";
import { SessionContext } from "../providers/SessionContext";
import {type SessionType} from "../types";

export type useSessionsReturnType = SessionType | null;

export function useSessions(): useSessionsReturnType {
  const { sessions } = useContext(SessionContext);

  return sessions;
}
