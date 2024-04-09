import { useKernelClient } from "./useKernelClient";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { type WriteContractParameters } from "@wagmi/core";
import { KernelAccountClient, KernelSmartAccount } from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { encodeFunctionData, type Hash } from "viem";
import { ResolvedRegister } from "wagmi";

export type SendUserOperationVariables = WriteContractParameters[];

export type UseSendUserOperationKey = {
  parameters: SendUserOperationVariables;
  kernelClient: KernelAccountClient<EntryPoint> | undefined | null;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
};

export type SendUserOperationReturnType = Hash

export type UseSendUserOperationReturnType = {
  write: ((parameters: SendUserOperationVariables) => void)
} & Omit<UseMutationResult<SendUserOperationReturnType, unknown, UseSendUserOperationKey, unknown>, 'mutate'>;

function mutationKey({ ...config }: UseSendUserOperationKey) {
  const { kernelAccount, kernelClient, parameters } = config;

  return [
    {
      entity: "sendUserOperation",
      kernelAccount,
      kernelClient,
      parameters,
    },
  ] as const;
}

async function mutationFn(config: UseSendUserOperationKey): Promise<SendUserOperationReturnType> {
  const { kernelAccount, kernelClient, parameters } = config;

  if (!kernelClient || !kernelAccount) {
    throw new Error("Kernel Client is required");
  }

  return kernelClient.sendUserOperation({
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
}

export function useSendUserOperation<
  config extends Config = ResolvedRegister["config"],
  context = unknown
>(): UseSendUserOperationReturnType {
  const { kernelAccount, kernelClient } = useKernelClient();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      kernelClient,
      kernelAccount,
      parameters: {} as SendUserOperationVariables,
    }),
    mutationFn,
  });

  const write = useMemo(() => {
    return (parameters: SendUserOperationVariables) => {
      mutate({
        parameters,
        kernelAccount,
        kernelClient,
      });
    };
  }, [mutate, kernelClient, kernelAccount]);

  return {
    ...result,
    write,
  };
}
