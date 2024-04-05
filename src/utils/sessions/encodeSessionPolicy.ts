import { type Policy } from "@zerodev/permissions";
import {
  type CallPolicyParams,
  type GasPolicyParams,
  type RateLimitPolicyParams,
  type SignatureCallerPolicyParams,
  type SudoPolicyParams,
} from "@zerodev/permissions/policies";
import { Permission } from "@zerodev/session-key";
import { type Abi, type Hex } from "viem";

type EncodedPolicy = {
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

export function serializePolicy(policies: Policy[]) {
  return policies.map((policy) => ({
    getPolicyData: policy.getPolicyData(),
    getPolicyInfoInBytes: policy.getPolicyInfoInBytes(),
    policyParams: policy.policyParams,
  }));
}

export function desirializePolicy(encodedPolicy: EncodedPolicy): Policy {
  return {
    getPolicyData: (permissionID?: Hex) => encodedPolicy.getPolicyData,
    getPolicyInfoInBytes: () => encodedPolicy.getPolicyInfoInBytes,
    policyParams: encodedPolicy.policyParams,
  };
}
