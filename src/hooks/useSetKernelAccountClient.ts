import { useContext } from "react";
import { ZeroDevValidatorContext } from "../providers/ZeroDevValidatorContext";
import { KernelAccountClient } from "@zerodev/sdk";
import {EntryPoint} from "permissionless/types";

export type useSetKernelAccountClientReturnType = {
  setKernelAccountClient: (client: KernelAccountClient<EntryPoint> | null) => void
}

export function useSetKernelAccountClient(): useSetKernelAccountClientReturnType {
  const { setKernelAccountClient } = useContext(ZeroDevValidatorContext);

  return {
    setKernelAccountClient,
  };
}
