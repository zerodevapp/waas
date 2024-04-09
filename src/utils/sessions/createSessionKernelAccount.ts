import { type PermissionPlugin, type Policy } from "@zerodev/permissions";
import { SessionKeyPlugin, type Permission } from "@zerodev/session-key";
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { type EntryPoint } from "permissionless/types";
import {
  concat,
  keccak256,
  pad,
  slice,
  toHex,
  zeroAddress,
  type Abi,
} from "viem";
import { getSessionKernelAccount } from "./getSessionKernelAccount";
import { type CreateSessionKernelAccountType } from "../../types";

export const createSessionKernelAccount = async ({
  sessionSigner,
  publicClient,
  policies,
  permissions,
  sudoValidator,
  entryPoint,
}: CreateSessionKernelAccountType) => {
  if (entryPoint === ENTRYPOINT_ADDRESS_V07 && !policies) {
    throw new Error("No policies provided for kernel v3");
  } else if (entryPoint === ENTRYPOINT_ADDRESS_V06 && !permissions) {
    throw new Error("No permissions provided for kernel v2");
  }
  const { kernelAccount, sessionValidator } = await getSessionKernelAccount({
    sessionSigner,
    publicClient,
    sudoValidator,
    entryPoint,
    policies,
    permissions,
  });
  // kernel v2
  if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
    const enableSignature =
      await kernelAccount.kernelPluginManager.getPluginEnableSignature(
        kernelAccount.address
      );
    const sessionKeyData = (
      sessionValidator as SessionKeyPlugin<EntryPoint>
    ).getPluginSerializationParams();
    const sessionId = slice(
      keccak256(
        concat([
          sessionSigner.address,
          pad(toHex(sessionKeyData?.validAfter ?? 0), {
            size: 6,
          }),
          pad(toHex(sessionKeyData?.validUntil ?? 0), {
            size: 6,
          }),
          sessionKeyData?.paymaster ?? zeroAddress,
        ])
      ),
      0,
      2
    );
    return {
      sessionId,
      smartAccount: kernelAccount.address,
      enableSignature,
      policies: [] as Policy[],
      permissions: permissions!,
    };
  }
  // kernel v3
  const enableSignature =
    await kernelAccount.kernelPluginManager.getPluginEnableSignature(
      kernelAccount.address
    );
  const sessionId = (
    sessionValidator as PermissionPlugin<EntryPoint>
  ).getIdentifier();
  return {
    sessionId,
    smartAccount: kernelAccount.address,
    enableSignature,
    policies: policies!,
    permissions: [] as Permission<Abi>[],
  };
};
