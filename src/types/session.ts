import { type Policy } from "@zerodev/permissions";
import { KernelValidator } from "@zerodev/sdk";
import { type Permission } from "@zerodev/session-key";
import { type EntryPoint } from "permissionless/types";
import {
  PrivateKeyAccount,
  type Abi,
  type PublicClient,
} from "viem";
import {
  type CallPolicyParams,
  type GasPolicyParams,
  type RateLimitPolicyParams,
  type SignatureCallerPolicyParams,
  type SudoPolicyParams,
} from "@zerodev/permissions/policies";

export type CreateSessionKernelAccountType = {
  sessionSigner: PrivateKeyAccount;
  publicClient: PublicClient;
  sudoValidator: KernelValidator<EntryPoint>;
  entryPoint: EntryPoint;
  policies?: Policy[];
  permissions?: Permission<Abi>[];
  enableSignature?: `0x${string}`;
};

export type EncodedPolicy = {
  getPolicyData: `0x${string}`;
  getPolicyInfoInBytes: `0x${string}`;
  policyParams:
    | CallPolicyParams<Abi | readonly unknown[], string>
    | GasPolicyParams
    | RateLimitPolicyParams
    | SignatureCallerPolicyParams
    | SudoPolicyParams;
};

export type EncodedSessionInfoType = {
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: EncodedPolicy[];
  permissions: Permission<Abi>[];
  sessionKey: `0x${string}`;
};

export type EncodedSessionType = {
  [sessionId: `0x${string}`]: EncodedSessionInfoType;
};

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
