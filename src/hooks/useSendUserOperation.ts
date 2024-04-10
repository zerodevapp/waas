import { useKernelClient } from "./useKernelClient";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type WriteContractParameters } from "@wagmi/core";
import { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { PaymasterERC20, PaymasterSPONSOR } from "../types";

export type SendUserOperationVariables = WriteContractParameters[];

export type UseSendUserOperationParameters = {
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
};

export type UseSendUserOperationKey = {
  variables: SendUserOperationVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined | null;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
};

export type SendUserOperationReturnType = Hash

export type UseSendUserOperationReturnType = {
  write: ((variables: SendUserOperationVariables) => void)
} & Omit<UseMutationResult<SendUserOperationReturnType, unknown, UseSendUserOperationKey, unknown>, 'mutate'>;

function mutationKey({ ...config }: UseSendUserOperationKey) {
  const { kernelAccount, kernelClient, variables } = config;

  return [
    {
      entity: "sendUserOperation",
      kernelAccount,
      kernelClient,
      variables,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationKey): Promise<SendUserOperationReturnType> {
  const { kernelAccount, kernelClient, variables } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
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
    },
  });
}

export function useSendUserOperation(
  parameters: UseSendUserOperationParameters = {}
): UseSendUserOperationReturnType {
  const { kernelAccount, kernelClient, error } = useKernelClient(parameters);

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      kernelClient,
      kernelAccount,
      variables: {} as SendUserOperationVariables,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    return (variables: SendUserOperationVariables) => {
      mutate({
        variables,
        kernelAccount,
        kernelClient,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    error: error ?? result.error,
    write,
  };
}
