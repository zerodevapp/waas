import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  type KernelAccountClient,
  type KernelSmartAccount,
  type KernelValidator,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { useMemo } from "react";
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext";
import { type Transport, type Chain } from "viem";

export type UseDisconnectKernelClientKey = {
  setValidator:
    | ((validator: KernelValidator<EntryPoint> | null) => void)
    | null
    | undefined;
  setKernelAccount:
    | ((kernelAccount: KernelSmartAccount<EntryPoint> | null) => void)
    | undefined
    | null;
  setEntryPoint: ((entryPoint: EntryPoint | null) => void) | null | undefined;
  setKernelAccountClient:
    | ((kernelAccountClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>> | null) => void)
    | null
    | undefined;
};

export type DisconnectKernelClientReturnType = boolean;

export type UseDisconnectKernelClientReturnType = {
  disconnect: () => void;
} & Omit<
  UseMutationResult<
    DisconnectKernelClientReturnType,
    unknown,
    UseDisconnectKernelClientKey,
    unknown
  >,
  "mutate"
>;

function mutationKey({ ...config }: UseDisconnectKernelClientKey) {
  const {
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  } = config;

  return [
    {
      entity: "DisconnectKernelClient",
      setValidator,
      setKernelAccount,
      setEntryPoint,
      setKernelAccountClient,
    },
  ] as const;
}

async function mutationFn(
  config: UseDisconnectKernelClientKey
): Promise<DisconnectKernelClientReturnType> {
  const {
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  } = config;

  if (
    !setValidator ||
    !setKernelAccount ||
    !setEntryPoint ||
    !setKernelAccountClient
  ) {
    throw new Error("setKernelAccountClient is required");
  }

  setValidator(null);
  setKernelAccount(null);
  setEntryPoint(null);
  setKernelAccountClient(null);

  return true;
}

export function useDisconnectKernelClient(): UseDisconnectKernelClientReturnType {
  const {
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  } = useSetKernelAccount();

  const { mutate, ...result } = useMutation({
    mutationKey: mutationKey({
      setValidator: undefined,
      setKernelAccount: undefined,
      setEntryPoint: undefined,
      setKernelAccountClient: undefined,
    }),
    mutationFn,
  });

  const disconnect = useMemo(() => {
    return () =>
      mutate({
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient,
      });
  }, [
    mutate,
    setValidator,
    setKernelAccount,
    setEntryPoint,
    setKernelAccountClient,
  ]);

  return {
    ...result,
    disconnect,
  };
}
