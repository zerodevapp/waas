import { toPermissionValidator, type Policy } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import {
  KernelAccountAbi,
  KernelV3ExecuteAbi,
  KernelValidator,
  createKernelAccount,
} from "@zerodev/sdk";
import {
  signerToSessionKeyValidator,
  type Permission,
} from "@zerodev/session-key";
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { type EntryPoint } from "permissionless/types";
import {
  PrivateKeyAccount,
  getAbiItem,
  toFunctionSelector,
  zeroAddress,
  type Abi,
  type PublicClient,
} from "viem";

export type GetSessionKernelAccountType = {
  sessionSigner: PrivateKeyAccount;
  publicClient: PublicClient;
  sudoValidator: KernelValidator<EntryPoint>;
  entryPoint: EntryPoint;
  policies?: Policy[];
  permissions?: Permission<Abi>[];
  enableSignature?: `0x${string}`;
};

export type GetSessionValidatorType = {
  sessionSigner: PrivateKeyAccount;
  publicClient: PublicClient;
  entryPoint: EntryPoint;
  policies?: Policy[];
  permissions?: Permission<Abi>[];
};

export const getSessionKernelAccount = async ({
  sessionSigner,
  publicClient,
  sudoValidator,
  entryPoint,
  policies,
  permissions,
  enableSignature,
}: GetSessionKernelAccountType) => {
  if (entryPoint === ENTRYPOINT_ADDRESS_V07 && !policies) {
    throw new Error("No policies provided for kernel v3");
  } else if (entryPoint === ENTRYPOINT_ADDRESS_V06 && !permissions) {
    throw new Error("No permissions provided for kernel v2");
  }

  const sessionValidator = await getSessionValidator({
    sessionSigner,
    publicClient,
    policies,
    permissions,
    entryPoint,
  });
  const executeDataSelector = getExecutorDataSelector(entryPoint);

  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint: entryPoint,
    plugins: {
      sudo: sudoValidator,
      regular: sessionValidator,
      entryPoint: entryPoint,
      action: {
        address: zeroAddress,
        selector: executeDataSelector,
      },
      pluginEnableSignature: enableSignature,
    },
  });
  return {
    kernelAccount,
    sessionValidator,
  };
};

const getExecutorDataSelector = (entryPoint: EntryPoint) => {
  if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
    return toFunctionSelector(
      getAbiItem({
        abi: KernelAccountAbi,
        name: "executeBatch",
      })
    );
  }
  return toFunctionSelector(
    getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
  );
};

const getSessionValidator = async ({
  sessionSigner,
  publicClient,
  policies,
  permissions,
  entryPoint,
}: GetSessionValidatorType) => {
  if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
    return await signerToSessionKeyValidator(publicClient, {
      signer: sessionSigner,
      validatorData: {
        permissions: permissions,
      },
    });
  }
  const ecdsaModularSigner = toECDSASigner({ signer: sessionSigner });
  return await toPermissionValidator(publicClient, {
    entryPoint: entryPoint,
    signer: ecdsaModularSigner,
    policies: policies!,
  });
};
