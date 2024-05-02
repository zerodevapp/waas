import { useContext } from "react"
import type { Config } from "../createConfig"
import { ZerodevNotConfiguredError } from "../errors"
import { ZeroDevConfigContext } from "../providers/ZeroDevConfigContext"

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig(): UseConfigReturnType {
    const { config } = useContext(ZeroDevConfigContext)
    if (!config) throw new ZerodevNotConfiguredError()
    return config
}
