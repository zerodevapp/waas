import { logout } from "@zerodev/social-validator"
import { useMemo } from "react"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"
import { useConfig } from "./useConfig"

export function useDisconnectSocial() {
    const { validator } = useKernelAccount()
    const config = useConfig()
    const projectId = config.projectIds[config.state.chainId]

    const logoutSocial = useMemo(() => {
        return async () => {
            if (validator?.source === "SocialValidator") {
                await logout({ projectId })
            }
        }
    }, [validator, projectId])

    return { logoutSocial }
}
