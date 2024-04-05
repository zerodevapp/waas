import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { KernelValidator } from "@zerodev/sdk";
import { type Permission } from "@zerodev/session-key";
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { type Abi, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useUpdateSession } from "../providers/SessionContext";
import { useKernelAccount } from "../providers/ZeroDevValidatorContext";
import { createSessionKernelAccount } from "../utils/sessions/createSessionKernelAccount";
import { createSessionKey } from "../utils/sessions/manageSession";
import {type Policy} from "@zerodev/permissions";

export type CreateBasicSessionWriteArgs = {
  permissions?: Permission<Abi>[];
};

export type UseCreateBasicSessionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreateBasicSessionWriteArgs;
  client: PublicClient | undefined;
  entryPoint: EntryPoint | null;
};

type UseCreateBasicSessionReturnType = {
  write?: (policies: CreateBasicSessionWriteArgs) => void;
} & Omit<UseMutationResult<CreateBasicSessionReturnType, unknown, UseCreateBasicSessionKey, unknown>, 'mutate'>;

export type CreateBasicSessionReturnType = {
  sessionKey: `0x${string}`;
  sessionId: `0x${string}`;
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  permissions: Permission<Abi>[];
}

function mutationKey({ ...config }: UseCreateBasicSessionKey) {
  const { policies, client, validator, entryPoint } = config;

  return [
    {
      entity: "CreateSession",
      client,
      validator,
      policies,
      entryPoint,
    },
  ] as const;
}

async function mutationFn(config: UseCreateBasicSessionKey): Promise<CreateBasicSessionReturnType> {
  const { policies, validator, client, entryPoint } = config;

  if (!validator || !client || !entryPoint) {
    throw new Error("No validator provided");
  }
  if (entryPoint !== ENTRYPOINT_ADDRESS_V06) {
    throw new Error("Only kernel v2 is supported in useCreateBasicSession");
  }
  if (!policies.permissions) {
    throw new Error("No permissions provided");
  }

  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const kernelAccount = await createSessionKernelAccount({
    sessionSigner,
    publicClient: client,
    sudoValidator: validator,
    entryPoint: entryPoint,
    permissions: policies.permissions,
  });
  return {
    sessionKey,
    ...kernelAccount,
  };
}

export function useCreateBasicSession(): UseCreateBasicSessionReturnType {
  const { validator, entryPoint } = useKernelAccount();
  const client = usePublicClient();
  const { updateSession } = useUpdateSession();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      client,
      validator,
      policies: { permissions: undefined },
      entryPoint,
    }),
    mutationFn,
    onSuccess: (data) => {
      updateSession(data);
    },
  });

  const write = useMemo(() => {
    if (!validator || !client || !entryPoint) return undefined;
    return (policies: CreateBasicSessionWriteArgs) =>
      mutate({
        policies,
        client,
        validator,
        entryPoint,
      });
  }, [mutate, validator, client, entryPoint]);

  return {
    ...result,
    write,
  };
}
