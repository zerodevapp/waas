import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { type PaymasterERC20, type PaymasterSPONSOR } from "../types";
import { useSessionKernelClient } from "./useSessionKernelClient";

export type UseSendUserOperationWithSessionParameters = {
  sessionId?: `0x${string}` | null | undefined;
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
};

export type SendUserOperationWithSessionVariables = WriteContractParameters[];

export type UseSendUserOperationWithSessionKey = {
  variables: SendUserOperationWithSessionVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
};

export type SendUserOperationWithSessionReturnType = Hash

export type UseSendUserOperationWithSessionReturnType = {
  isDisabled: boolean;
  write: ((variables: SendUserOperationWithSessionVariables) => void)
} & Omit<UseMutationResult<SendUserOperationWithSessionReturnType, unknown, UseSendUserOperationWithSessionKey, unknown>, 'mutate'>;
 

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
  const { variables, kernelClient, kernelAccount } = config;

  return [
    {
      entity: "sendUserOperationWithSession",
      variables,
      kernelClient,
      kernelAccount,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
  const { variables, kernelClient, kernelAccount } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData(
        variables.map((p) => ({
          to: p.address,
          value: p.value ?? 0n,
          data: encodeFunctionData(p),
        }))
      ),
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession(
  parameters: UseSendUserOperationWithSessionParameters = {}
): UseSendUserOperationWithSessionReturnType {  const {
    kernelClient,
    kernelAccount,
    isLoading,
    error: clientError,
  } = useSessionKernelClient(parameters);

  const { mutate, error, ...result } = useMutation({
    mutationKey: mutationKey({
      variables: {} as SendUserOperationWithSessionVariables,
      kernelClient,
      kernelAccount,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    return (variables: SendUserOperationWithSessionVariables) => {
      mutate({
        variables,
        kernelClient,
        kernelAccount,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    isDisabled: !!clientError,
    isPending: isLoading || result.isPending,
    error: error || clientError,
    write,
  };
}
