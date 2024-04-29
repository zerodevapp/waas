import {
    getSocialValidator,
    initiateLogin,
    isAuthorized
} from "@zerodev/social-validator"
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react"
import { useCreateKernelClientSocial } from "../hooks/useCreateKernelClientSocial"
import { useZeroDevConfig } from "./ZeroDevAppContext"

interface SocialContextValue {
    isSocialPending: boolean
    setIsSocialPending: (isPending: boolean) => void
    login: (
        socialProvider: "google" | "facebook",
        oauthCallbackUrl?: string
    ) => void
}

interface SocialProviderProps {
    children: React.ReactNode
}

export const SocialContext = createContext<SocialContextValue>({
    isSocialPending: false,
    setIsSocialPending: () => {},
    login: () => {}
})

export function SocialProvider({ children }: SocialProviderProps) {
    const { appId } = useZeroDevConfig()
    const [isSocialPending, setIsSocialPending] = useState(false)

    const login = useCallback(
        (socialProvider: "google" | "facebook", oauthCallbackUrl?: string) => {
            if (!appId) {
                throw new Error("missing appId")
            }
            initiateLogin({
                socialProvider,
                oauthCallbackUrl,
                projectId: appId
            })
        },
        [appId]
    )

    return (
        <SocialContext.Provider
            value={useMemo(
                () => ({
                    isSocialPending,
                    setIsSocialPending,
                    login
                }),
                [isSocialPending, login]
            )}
        >
            {children}
        </SocialContext.Provider>
    )
}

export function useSocial() {
    const context = useContext(SocialContext)

    if (context === undefined) {
        throw new Error("useSocial must be used within a SocialProvider")
    }

    return context
}
