import { useKernelClient } from "./useKernelClient";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import { 
  type KernelAccountClient, 
  type KernelSmartAccount, 
  getCustomNonceKeyFromString 
} from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { PaymasterERC20, PaymasterSPONSOR } from "../types";
import { generateRandomString } from "../utils";

export type SendUserOperationVariables = WriteContractParameters[];

export type UseSendUserOperationParameters = {
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
  isParallel?: boolean;
};

export type UseSendUserOperationKey = {
  variables: SendUserOperationVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined | null;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
  isParallel: boolean;
  seed: string
};

export type SendUserOperationReturnType = Hash

export type UseSendUserOperationReturnType = {
  write: ((variables: SendUserOperationVariables) => void)
} & Omit<UseMutationResult<SendUserOperationReturnType, unknown, UseSendUserOperationKey, unknown>, 'mutate'>;

function mutationKey({ ...config }: UseSendUserOperationKey) {
  const { kernelAccount, kernelClient, variables, isParallel, seed } = config;

  return [
    {
      entity: "sendUserOperation",
      kernelAccount,
      kernelClient,
      variables,
      isParallel,
      seed
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationKey): Promise<SendUserOperationReturnType> {
  const { kernelAccount, kernelClient, variables, isParallel, seed } = config;

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

  return kernelClient.sendUserOperation({
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
}

export function useSendUserOperation(
  parameters: UseSendUserOperationParameters = {}
): UseSendUserOperationReturnType {
  const { isParallel = true } = parameters;
  const { kernelAccount, kernelClient, error } = useKernelClient(parameters);

  const seed = useMemo(() => generateRandomString(), []);

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      kernelClient,
      kernelAccount,
      variables: {} as SendUserOperationVariables,
      isParallel: isParallel,
      seed
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    return (variables: SendUserOperationVariables) => {
      mutate({
        variables,
        kernelAccount,
        kernelClient,
        isParallel: isParallel,
        seed: generateRandomString()
      });
    };
  }, [mutate, kernelClient, kernelAccount, isParallel]);

  return {
    ...result,
    error: error ?? result.error,
    write,
  };
}
