import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import type { EntryPoint } from "permissionless/types"
import type { KernelVersionType } from "../types"

export const getEntryPointFromVersion = (
    version: KernelVersionType
): EntryPoint => {
    if (version === "v2") return ENTRYPOINT_ADDRESS_V06
    return ENTRYPOINT_ADDRESS_V07
}
