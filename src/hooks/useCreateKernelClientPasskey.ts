import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  createPasskeyValidator,
  getPasskeyValidator,
} from "@zerodev/passkey-validator";
import { createKernelAccount, type KernelValidator, type KernelSmartAccount } from "@zerodev/sdk";
import type { EntryPoint } from "permissionless/types";
import { useEffect, useMemo } from "react";
import { type PublicClient } from "viem";
import { usePublicClient } from "wagmi";
import { useZeroDevConfig } from "../providers/ZeroDevAppContext";
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext";
import { type KernelVersionType } from "../types";
import { getEntryPointFromVersion } from "../utils/entryPoint";
import { getWeb3AuthNValidatorFromVersion } from "../utils/webauthn";

type PasskeConnectType = "register" | "login";

export type UseCreateKernelClientPasskeyParameters = {
  version: KernelVersionType;
};
export type CreateKernelClientPasskeyVariables = {
  username: string;
};

export type UseCreateKernelClientPasskeyKey = {
  username: string | undefined;
  publicClient: PublicClient | undefined | null;
  appId: string | undefined | null;
  type: PasskeConnectType | undefined | null;
  version: KernelVersionType;
};

export type CreateKernelClientPasskeyReturnType = {
  validator: KernelValidator<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  entryPoint: EntryPoint;
}

export type UseCreateKernelClientPasskeyReturnType = {
  connectRegister: ({ username }: CreateKernelClientPasskeyVariables) => void,
  connectLogin: () => void,
} & Omit<UseMutationResult<CreateKernelClientPasskeyReturnType, unknown, UseCreateKernelClientPasskeyKey, unknown>, 'mutate'>;


function mutationKey({ ...config }: UseCreateKernelClientPasskeyKey) {
  const { username, publicClient, appId, type } = config;

  return [
    {
      entity: "CreateKernelClient",
      username,
      publicClient,
      appId,
      type,
    },
  ] as const;
}

async function mutationFn(config: UseCreateKernelClientPasskeyKey): Promise<CreateKernelClientPasskeyReturnType> {
  const { username, publicClient, appId, type, version } = config;

  if (!publicClient || !appId) {
    throw new Error("missing publicClient or appId");
  }
  let passkeyValidator: KernelValidator<EntryPoint>;
  const entryPoint = getEntryPointFromVersion(version);
  const webauthnValidator = getWeb3AuthNValidatorFromVersion(version);

  if (type === "register") {
    if (!username) {
      throw new Error("missing username");
    }
    passkeyValidator = await createPasskeyValidator(publicClient, {
      passkeyName: username,
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId}`,
      entryPoint: entryPoint,
      validatorAddress: webauthnValidator,
    });
  } else {
    passkeyValidator = await getPasskeyValidator(publicClient!, {
      passkeyServerUrl: `https://passkeys.zerodev.app/api/v3/${appId!}`,
      entryPoint: entryPoint,
      validatorAddress: webauthnValidator,
    });
  }

  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint: entryPoint,
    plugins: {
      sudo: passkeyValidator,
    },
  });

  return { validator: passkeyValidator, kernelAccount, entryPoint };
}

export function useCreateKernelClientPasskey({
  version,
}: UseCreateKernelClientPasskeyParameters): UseCreateKernelClientPasskeyReturnType {
  const {
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  } = useSetKernelAccount();
  const { appId } = useZeroDevConfig();
  const client = usePublicClient();

  const { data, mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      appId: appId,
      publicClient: client,
      username: undefined,
      type: undefined,
      version,
    }),
    mutationFn,
    onSuccess: (data) => {
      setValidator(data.validator);
      setKernelAccount(data.kernelAccount);
      setEntryPoint(data.entryPoint);
      setKernelAccountClient(null);
    }
  });

  const connectRegister = useMemo(() => {
    return ({ username }: CreateKernelClientPasskeyVariables) =>
      mutate({
        appId,
        publicClient: client,
        username,
        version,
        type: "register",
      });
  }, [appId, mutate, client, version]);

  const connectLogin = useMemo(() => {
    return () =>
      mutate({
        appId,
        publicClient: client,
        username: undefined,
        type: "login",
        version,
      });
  }, [appId, mutate, client, version]);

  return {
    ...result,
    data,
    isPending: !client || result.isPending,
    connectRegister,
    connectLogin,
  };
}
