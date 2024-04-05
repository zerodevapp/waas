import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type Policy } from "@zerodev/permissions";
import { KernelValidator } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { type PublicClient, type Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useUpdateSession } from "../providers/SessionContext";
import { useKernelAccount } from "../providers/ZeroDevValidatorContext";
import { createSessionKernelAccount } from "../utils/sessions/createSessionKernelAccount";
import { createSessionKey } from "../utils/sessions/manageSession";
import { type Permission } from "@zerodev/session-key";

export type CreateSessionWriteArgs = {
  policies?: Policy[];
};

export type UseCreateSessionKey = {
  validator: KernelValidator<EntryPoint> | null;
  policies: CreateSessionWriteArgs;
  client: PublicClient | undefined;
  entryPoint: EntryPoint | null;
};

export type CreateSessionReturnType = {
  sessionKey: `0x${string}`;
  sessionId: `0x${string}`;
  smartAccount: `0x${string}`;
  enableSignature: `0x${string}`;
  policies: Policy[];
  permissions: Permission<Abi>[];
}

export type UseCreateSessionReturnType = {
  write?: (policies: CreateSessionWriteArgs) => void;
} & Omit<UseMutationResult<CreateSessionReturnType, unknown, UseCreateSessionKey, unknown>, 'mutate'>;

function mutationKey({ ...config }: UseCreateSessionKey) {
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

async function mutationFn(config: UseCreateSessionKey): Promise<CreateSessionReturnType> {
  const { policies, validator, client, entryPoint } = config;

  if (!validator || !client || !entryPoint) {
    throw new Error("No validator provided");
  }
  if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
    throw new Error("Only kernel v3 is supported in useCreateSession");
  }
  if (!policies.policies) {
    throw new Error("No policies provided");
  }

  const sessionKey = createSessionKey();
  const sessionSigner = privateKeyToAccount(sessionKey);

  const kernelAccount = await createSessionKernelAccount({
    sessionSigner,
    publicClient: client,
    sudoValidator: validator,
    entryPoint: entryPoint,
    policies: policies.policies,
  });
  return {
    sessionKey,
    ...kernelAccount,
  };
}

export function useCreateSession(): UseCreateSessionReturnType {
  const { validator, entryPoint } = useKernelAccount();
  const client = usePublicClient();
  const { updateSession } = useUpdateSession();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      client,
      validator,
      policies: { policies: undefined },
      entryPoint,
    }),
    mutationFn,
    onSuccess: (data) => {
      updateSession(data);
    },
  });

  const write = useMemo(() => {
    if (!validator || !client || !entryPoint) return undefined;
    return (policies: CreateSessionWriteArgs) =>
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
