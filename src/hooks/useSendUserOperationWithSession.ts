import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
  getCustomNonceKeyFromString,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { type PaymasterERC20, type PaymasterSPONSOR } from "../types";
import { useSessionKernelClient } from "./useSessionKernelClient";
import { generateRandomString } from "../utils";

export type UseSendUserOperationWithSessionParameters = {
  sessionId?: `0x${string}` | null | undefined;
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
  isParallel?: boolean;
};

export type SendUserOperationWithSessionVariables = WriteContractParameters[];

export type UseSendUserOperationWithSessionKey = {
  variables: SendUserOperationWithSessionVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
  isParallel: boolean;
  seed: string
};

export type SendUserOperationWithSessionReturnType = Hash

export type UseSendUserOperationWithSessionReturnType = {
  isDisabled: boolean;
  write: ((variables: SendUserOperationWithSessionVariables) => void)
} & Omit<UseMutationResult<SendUserOperationWithSessionReturnType, unknown, UseSendUserOperationWithSessionKey, unknown>, 'mutate'>;
 

function mutationKey({ ...config }: UseSendUserOperationWithSessionKey) {
  const { variables, kernelClient, kernelAccount, isParallel, seed } = config;

  return [
    {
      entity: "sendUserOperationWithSession",
      variables,
      kernelClient,
      kernelAccount,
      isParallel,
      seed
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationWithSessionKey) {
  const { variables, kernelClient, kernelAccount, isParallel, seed } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }
  let nonce;
  if (isParallel) {
    const customNonceKey = getCustomNonceKeyFromString(
      seed,
      kernelAccount.entryPoint
    )
    nonce = await kernelAccount.getNonce(customNonceKey)
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
      nonce
    },
  });

  return userOpHash;
}

export function useSendUserOperationWithSession(
  parameters: UseSendUserOperationWithSessionParameters = {}
): UseSendUserOperationWithSessionReturnType { 
  const { isParallel = true } = parameters;
  const {
    kernelClient,
    kernelAccount,
    isLoading,
    error: clientError,
  } = useSessionKernelClient(parameters);

  const seed = useMemo(() => generateRandomString(), []);

  const { mutate, error, ...result } = useMutation({
    mutationKey: mutationKey({
      variables: {} as SendUserOperationWithSessionVariables,
      kernelClient,
      kernelAccount,
      isParallel: isParallel,
      seed
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    return (variables: SendUserOperationWithSessionVariables) => {
      mutate({
        variables,
        kernelClient,
        kernelAccount,
        isParallel: isParallel,
        seed: generateRandomString()
      });
    };
  }, [mutate, kernelClient, kernelAccount, isParallel]);

  return {
    ...result,
    isDisabled: !!clientError,
    isPending: isLoading || result.isPending,
    error: error || clientError,
    write,
  };
}
