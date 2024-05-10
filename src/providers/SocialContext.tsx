import { initiateLogin } from "@zerodev/social-validator"
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react"
import { useConfig } from "../hooks/useConfig"

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
    const config = useConfig()
    const projectId = config.projectIds[config.state.chainId]
    const [isSocialPending, setIsSocialPending] = useState(false)

    const login = useCallback(
        (socialProvider: "google" | "facebook", oauthCallbackUrl?: string) => {
            initiateLogin({
                socialProvider,
                oauthCallbackUrl,
                projectId
            })
        },
        [projectId]
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
