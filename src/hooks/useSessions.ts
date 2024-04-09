import { useContext } from "react";
import { SessionContext } from "../providers/SessionContext";
import {type SessionInfoType} from "../types";

export type useSessionsReturnType = SessionInfoType;

export function useSessions(): useSessionsReturnType {
  const { sessions } = useContext(SessionContext);

  return sessions;
}
