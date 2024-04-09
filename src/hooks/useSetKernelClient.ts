import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type KernelAccountClient, type KernelSmartAccount } from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useContext, useMemo } from "react";
import { ZeroDevValidatorContext } from "../providers/ZeroDevValidatorContext";
import { type Transport, type Chain } from "viem";

export type UseSetKernelClientKey = {
  kernelClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>> | undefined;
  setKernelAccountClient: (
    kernelAccountClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>> | null
  ) => void;
};

export type SetKernelClientReturnType = boolean;

export type UseSetKernelClientReturnType = {
  setKernelClient: (kernelClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>>) => void;
} & Omit<
  UseMutationResult<
    SetKernelClientReturnType,
    unknown,
    UseSetKernelClientKey,
    unknown
  >,
  "mutate"
>;

function mutationKey({ ...config }: UseSetKernelClientKey) {
  const { kernelClient, setKernelAccountClient } = config;

  return [
    {
      entity: "SetKernelClient",
      kernelClient,
      setKernelAccountClient,
    },
  ] as const;
}

async function mutationFn(
  config: UseSetKernelClientKey
): Promise<SetKernelClientReturnType> {
  const { setKernelAccountClient, kernelClient } = config;

  if (!kernelClient || !setKernelAccountClient) {
    throw new Error("kernelClient is required");
  }

  setKernelAccountClient(kernelClient);

  return true;
}

export function useSetKernelClient(): UseSetKernelClientReturnType {
  const { setKernelAccountClient } = useContext(ZeroDevValidatorContext);

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      setKernelAccountClient,
      kernelClient: undefined,
    }),
    mutationFn,
  });

  const setKernelClient = useMemo(() => {
    return (kernelClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>>) => {
      mutate({
        setKernelAccountClient,
        kernelClient,
      });
    };
  }, [mutate, setKernelAccountClient]);

  return {
    ...result,
    setKernelClient,
  };
}
