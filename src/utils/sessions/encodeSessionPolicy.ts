import { type Policy } from "@zerodev/permissions";
import { type Hex } from "viem";
import { type EncodedPolicy } from "../../types";

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
