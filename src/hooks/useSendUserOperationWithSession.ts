import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { useSessionKernelClient } from "./useSessionKernelClient";

export type UseSendUserOperationWithSessionParameters = {
  sessionId?: `0x${string}` | null | undefined;
};

export type SendUserOperationWithSessionVariables = WriteContractParameters[];

export type UseSendUserOperationWithSessionKey = {
  parameters: SendUserOperationWithSessionVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
};

export type SendUserOperationWithSessionReturnType = Hash

export type UseSendUserOperationWithSessionReturnType = {
  write: ((parameters: SendUserOperationWithSessionVariables) => void) | undefined
} & Omit<UseMutationResult<SendUserOperationWithSessionReturnType, unknown, UseSendUserOperationWithSessionKey, unknown>, 'mutate'>;
 

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
  const { parameters, kernelClient, kernelAccount } = config;

  return [
    {
      entity: "sendUserOperationWithSession",
      parameters,
      kernelClient,
      kernelAccount,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
  const { parameters, kernelClient, kernelAccount } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData(
        parameters.map((p) => ({
          to: p.address,
          value: p.value ?? 0n,
          data: encodeFunctionData(p),
        }))
      ),
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession({sessionId}: UseSendUserOperationWithSessionParameters = {}): UseSendUserOperationWithSessionReturnType {
  const {
    kernelClient,
    kernelAccount,
    error: clientError,
  } = useSessionKernelClient({
    sessionId: sessionId,
  });

  const { mutate, error, ...result } = useMutation({
    mutationKey: mutationKey({
      parameters: {} as SendUserOperationWithSessionVariables,
      kernelClient,
      kernelAccount,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    if (!kernelAccount || !kernelClient) return undefined;
    return (parameters: SendUserOperationWithSessionVariables) => {
      mutate({
        parameters,
        kernelClient,
        kernelAccount,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    error: error || clientError,
    write,
  };
}
