import { useContext } from "react";
import { SessionContext } from "../providers/SessionContext";

export function useSessions() {
  const { sessions } = useContext(SessionContext);

  return sessions;
}
