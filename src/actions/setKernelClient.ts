import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import {
    KernelClientInvalidError,
    type KernelClientInvalidErrorType
} from "../errors"

export type SetKernelClientParameters = KernelAccountClient<EntryPoint>

export type SetKernelClientReturnType = boolean

export type SetKernelClientErrorType = KernelClientInvalidErrorType

export async function setKernelClient(
    setKernelAccountClient: (
        kernelAccountClient: KernelAccountClient<EntryPoint>
    ) => void,
    parameters: SetKernelClientParameters
) {
    if (!parameters) throw new KernelClientInvalidError()

    setKernelAccountClient(parameters)

    return true
}
