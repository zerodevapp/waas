import { logout } from "@zerodev/social-validator"
import { useMemo } from "react"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useKernelAccount } from "../providers/ZeroDevValidatorContext"

export function useDisconnectSocial() {
    const { validator } = useKernelAccount()
    const { appId } = useZeroDevConfig()

    const logoutSocial = useMemo(() => {
        return async () => {
            if (validator?.source === "SocialValidator" && appId) {
                await logout({ projectId: appId })
            }
        }
    }, [validator, appId])

    return { logoutSocial }
}
