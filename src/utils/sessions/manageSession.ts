import { type Policy } from "@zerodev/permissions";
import { type Permission } from "@zerodev/session-key";
import { type Abi } from "viem";
import { generatePrivateKey } from "viem/accounts";
import {
  desirializePolicy,
  serializePolicy,
  type EncodedSessionType,
} from "./encodeSessionPolicy";

export type SessionInfoType = {
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  permissions: Permission<Abi>[];
  sessionKey: `0x${string}`;
};

export type SessionType = {
  [sessionId: `0x${string}`]: SessionInfoType;
};

export function createSessionKey() {
  return generatePrivateKey();
}

export function createSession(
  sessionId: `0x${string}`,
  smartAccount: `0x${string}`,
  enableSignature: `0x${string}`,
  policies: Policy[],
  permissions: Permission<Abi>[],
  sessionKey: `0x${string}`
) {
  let sessionKeyStorage: EncodedSessionType = {};
  try {
    sessionKeyStorage = JSON.parse(
      localStorage.getItem(`kernel_session`) || "{}"
    );
  } catch (err) {}

  sessionKeyStorage[sessionId] = {
    smartAccount,
    enableSignature,
    policies: serializePolicy(policies),
    permissions,
    sessionKey,
  };
  localStorage.setItem(`kernel_session`, JSON.stringify(sessionKeyStorage));
}

export function getAllSession(): SessionType | null {
  const sessionKey = localStorage.getItem(`kernel_session`);
  if (!sessionKey) return null;

  let session: SessionType = {};
  try {
    const encodedSession: EncodedSessionType = JSON.parse(sessionKey);
    for (const [sessionId, encodedSessionInfo] of Object.entries(
      encodedSession
    )) {
      session[sessionId as `0x${string}`] = {
        smartAccount: encodedSessionInfo.smartAccount,
        enableSignature: encodedSessionInfo.enableSignature,
        policies: encodedSessionInfo.policies.map(desirializePolicy),
        sessionKey: encodedSessionInfo.sessionKey,
        permissions: encodedSessionInfo.permissions,
      };
    }
  } catch (err) {}

  return session;
}

export function getSession(
  sessionId: `0x${string}` | undefined
): SessionInfoType | null {
  const sessionKey = getAllSession();
  if (!sessionKey || !sessionId) return null;

  return sessionKey[sessionId];
}
